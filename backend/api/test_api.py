from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import CustomUser, Player, Team, GameWeek


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


class AuthAndUserApiTests(APITestCase):
    def test_register_login_and_current_user(self):
        url_reg = reverse("register")
        res = self.client.post(
            url_reg,
            {"email": "new@example.com", "password": "secretpass123"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomUser.objects.filter(email="new@example.com").exists())

        url_token = reverse("token_obtain_pair")
        res = self.client.post(
            url_token,
            {"email": "new@example.com", "password": "secretpass123"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        access = res.data["access"]

        url_me = reverse("user")
        res = self.client.get(url_me, HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], "new@example.com")

    def test_current_user_requires_auth(self):
        url_me = reverse("user")
        res = self.client.get(url_me)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_rejects_duplicate_email(self):
        CustomUser.objects.create_user(email="dup@example.com", password="x")
        url_reg = reverse("register")
        res = self.client.post(
            url_reg,
            {"email": "dup@example.com", "password": "otherpass123"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class PublicReadApiTests(APITestCase):
    def test_players_list_public(self):
        Player.objects.create(name="Listed", position="Attacker")
        url = reverse("players")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_team_detail_public(self):
        user = CustomUser.objects.create_user(email="owner@example.com", password="x")
        team = Team.objects.create(name="Alpha", user=user)
        url = reverse("team-detail", kwargs={"pk": team.pk})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Alpha")


class TeamManagementApiTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="manager@example.com", password="pass12345"
        )
        url_token = reverse("token_obtain_pair")
        res = self.client.post(
            url_token,
            {"email": "manager@example.com", "password": "pass12345"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.access = res.data["access"]

    def _auth(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    def test_my_team_missing_returns_404(self):
        self._auth()
        url = reverse("team-detail-or-create")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_team_rejects_wrong_player_count(self):
        self._auth()
        players = _make_players(10)
        url = reverse("team-detail-or-create")
        res = self.client.post(
            url,
            {
                "name": "Short Squad",
                "players": [p.id for p in players],
                "captain": players[0].id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_team_rejects_captain_not_in_squad(self):
        self._auth()
        squad = _make_players(11)
        extra = Player.objects.create(name="Bench", position="Attacker", team="Other")
        url = reverse("team-detail-or-create")
        res = self.client.post(
            url,
            {
                "name": "Bad Captain",
                "players": [p.id for p in squad],
                "captain": extra.id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_team_requires_captain(self):
        self._auth()
        squad = _make_players(11)
        url = reverse("team-detail-or-create")
        res = self.client.post(
            url,
            {
                "name": "No Captain",
                "players": [p.id for p in squad],
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_team_success_with_captain(self):
        self._auth()
        squad = _make_players(11)
        captain = squad[0]
        url = reverse("team-detail-or-create")
        res = self.client.post(
            url,
            {
                "name": "Full Squad",
                "players": [p.id for p in squad],
                "captain": captain.id,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Full Squad")
        team = Team.objects.get(user=self.user)
        self.assertEqual(team.players.count(), 11)
        self.assertEqual(team.captain_id, captain.id)


class GameWeekApiTests(APITestCase):
    def test_game_weeks_requires_authentication(self):
        GameWeek.objects.create(
            week=1,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=6),
        )
        url = reverse("game-weeks")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_game_weeks_authenticated_lists_weeks(self):
        user = CustomUser.objects.create_user(email="gw@example.com", password="p")
        self.client.force_authenticate(user=user)
        GameWeek.objects.create(
            week=7,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=6),
        )
        url = reverse("game-weeks")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)


class LeagueTableApiTests(APITestCase):
    def test_teams_ordered_by_total_points_desc(self):
        u1 = CustomUser.objects.create_user(email="a@example.com", password="x")
        u2 = CustomUser.objects.create_user(email="b@example.com", password="x")
        Team.objects.create(name="Low", user=u1, total_points=10)
        Team.objects.create(name="High", user=u2, total_points=99)
        url = reverse("teams")
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        names = [row["name"] for row in res.data]
        self.assertEqual(names[0], "High")
        self.assertEqual(names[1], "Low")
