from datetime import timedelta
from unittest.mock import patch

from django.test import override_settings
from django.urls import resolve, reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import CustomUser, GameWeek, Player, Team, TeamSnapshot


def _make_players(count=11):
    positions = ["Attacker", "Midfielder", "Defender", "Goalkeeper"]
    players = []
    for i in range(count):
        players.append(
            Player.objects.create(
                name=f"Player {i}",
                position=positions[i % len(positions)],
                team="Test FC",
            )
        )
    return players


@override_settings(SECURE_SSL_REDIRECT=False)
class AdminMissingSnapshotsApiTests(APITestCase):
    """Staff-only preview/backfill used by the Admin page snapshot backfill control."""

    def setUp(self):
        today = timezone.now().date()
        self.gw = GameWeek.objects.create(
            week=9,
            start_date=today,
            end_date=today + timedelta(days=6),
        )
        self.staff = CustomUser.objects.create_user(
            email="staff@example.com", password="secret", is_staff=True
        )
        self.normal = CustomUser.objects.create_user(
            email="user@example.com", password="secret", is_staff=False
        )
        squad = _make_players(11)
        self.team_missing_snapshot = Team.objects.create(name="NoSnapYet", user=self.normal)
        self.team_missing_snapshot.players.set(squad)
        self.team_missing_snapshot.captain = squad[0]
        self.team_missing_snapshot.save()

    def test_preview_requires_auth(self):
        url = reverse("staff-missing-snapshots-preview")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_preview_forbidden_for_non_staff(self):
        self.client.force_authenticate(user=self.normal)
        url = reverse("staff-missing-snapshots-preview")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_preview_staff_includes_teams_without_snapshot_for_current_week(self):
        self.client.force_authenticate(user=self.staff)
        url = reverse("staff-missing-snapshots-preview")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["game_week"], 9)
        self.assertGreaterEqual(res.data["affected_count"], 1)
        team_ids = {row["team_id"] for row in res.data["affected_teams"]}
        self.assertIn(self.team_missing_snapshot.id, team_ids)

    def test_preview_404_when_no_current_gameweek(self):
        GameWeek.objects.all().delete()
        self.client.force_authenticate(user=self.staff)
        url = reverse("staff-missing-snapshots-preview")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_backfill_requires_auth(self):
        url = reverse("staff-missing-snapshots-backfill")
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_backfill_forbidden_for_non_staff(self):
        self.client.force_authenticate(user=self.normal)
        url = reverse("staff-missing-snapshots-backfill")
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_backfill_staff_creates_snapshots_and_returns_201(self):
        self.client.force_authenticate(user=self.staff)
        url = reverse("staff-missing-snapshots-backfill")
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertGreaterEqual(res.data["created_count"], 1)
        self.assertTrue(
            TeamSnapshot.objects.filter(
                team=self.team_missing_snapshot, game_week=self.gw
            ).exists()
        )

    def test_backfill_returns_200_with_zero_created_when_none_missing(self):
        snap = TeamSnapshot.objects.create(
            team=self.team_missing_snapshot,
            game_week=self.gw,
            captain=self.team_missing_snapshot.captain,
            weekly_points=0,
        )
        snap.players.set(self.team_missing_snapshot.players.all())
        self.client.force_authenticate(user=self.staff)
        url = reverse("staff-missing-snapshots-backfill")
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["created_count"], 0)

    def test_create_or_update_team_snapshots_button_endpoint_runs_command(self):
        self.client.force_authenticate(user=self.staff)
        url = reverse("staff-team-snapshots-create-or-update")
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("All team snapshots have been processed successfully", res.data["output"])
        self.assertTrue(
            TeamSnapshot.objects.filter(
                team=self.team_missing_snapshot, game_week=self.gw
            ).exists()
        )

    def test_create_or_update_team_snapshots_forbidden_for_non_staff(self):
        self.client.force_authenticate(user=self.normal)
        url = reverse("staff-team-snapshots-create-or-update")
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    @patch("api.views.call_command")
    def test_fetch_fixtures_cup_button_endpoint_runs_command(self, mock_call_command):
        def fake_call_command(command_name, stdout=None):
            self.assertEqual(command_name, "fetch_fixtures_cup")
            stdout.write("Fetched cup fixtures.")

        mock_call_command.side_effect = fake_call_command

        self.client.force_authenticate(user=self.staff)
        url = reverse("staff-fixtures-fetch-cup")
        res = self.client.post(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["output"], "Fetched cup fixtures.")
        mock_call_command.assert_called_once()

    def test_fetch_fixtures_cup_forbidden_for_non_staff(self):
        self.client.force_authenticate(user=self.normal)
        url = reverse("staff-fixtures-fetch-cup")
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_legacy_path_under_api_admin_hits_django_admin_not_snapshot_api(self):
        """Regression: /api/admin/ is django.contrib.admin — do not mount API routes there."""
        match = resolve("/api/admin/missing-snapshots/preview/")
        self.assertEqual(match.url_name, None)
        self.assertEqual(match.func.__name__, "catch_all_view")
