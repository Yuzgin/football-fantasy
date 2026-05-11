from datetime import date, timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import CustomUser, GameWeek, Player, Match, PlayerGameStats, Team, TeamSnapshot
from api.serializers import PlayerGameStatsSerializer


class PlayerGameStatsPointsTests(TestCase):
    def setUp(self):
        self.player = Player.objects.create(name="Test", position="Attacker")
        self.match = Match.objects.create(
            date=timezone.now(), team1="A", team2="B"
        )

    def test_player_points_sync_with_stats(self):
        data = {
            "player": self.player.id,
            "match": self.match.id,
            "goals": 1,
            "assists": 0,
            "yellow_cards": 0,
            "red_cards": 0,
            "clean_sheets": 0,
            "MOTM": 0,
            "Pen_Saves": 0,
        }
        serializer = PlayerGameStatsSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        stats = serializer.save()

        self.player.refresh_from_db()
        self.assertEqual(self.player.points, 6)

        update_serializer = PlayerGameStatsSerializer(stats, data={"goals": 2}, partial=True)
        self.assertTrue(update_serializer.is_valid(), update_serializer.errors)
        stats = update_serializer.save()

        self.player.refresh_from_db()
        self.assertEqual(self.player.points, 10)

        stats.delete()
        self.player.refresh_from_db()
        self.assertEqual(self.player.points, 0)

    def test_player_stats_sync_without_serializer(self):
        stats = PlayerGameStats.objects.create(
            player=self.player,
            match=self.match,
            goals=1,
            assists=1,
            yellow_cards=1,
            red_cards=0,
            clean_sheets=0,
            MOTM=0,
            Pen_Saves=0,
        )

        self.player.refresh_from_db()
        self.assertEqual(self.player.points, 8)
        self.assertEqual(self.player.goals, 1)
        self.assertEqual(self.player.assists, 1)
        self.assertEqual(self.player.yellow_cards, 1)

        stats.goals = 2
        stats.assists = 2
        stats.yellow_cards = 0
        stats.save()

        self.player.refresh_from_db()
        self.assertEqual(self.player.points, 16)
        self.assertEqual(self.player.goals, 2)
        self.assertEqual(self.player.assists, 2)
        self.assertEqual(self.player.yellow_cards, 0)

        stats.delete()
        self.player.refresh_from_db()
        self.assertEqual(self.player.points, 0)
        self.assertEqual(self.player.goals, 0)
        self.assertEqual(self.player.assists, 0)
        self.assertEqual(self.player.yellow_cards, 0)

    def test_signals_work_with_direct_save(self):
        """Test that signals work when PlayerGameStats are saved directly (like in admin)"""
        # Create initial stats
        stats = PlayerGameStats.objects.create(
            player=self.player,
            match=self.match,
            goals=1,
            assists=1,
            yellow_cards=0,
            red_cards=0,
            clean_sheets=0,
            MOTM=0,
            Pen_Saves=0,
        )
        
        # Verify initial totals
        self.player.refresh_from_db()
        self.assertEqual(self.player.points, 9)
        self.assertEqual(self.player.goals, 1)
        self.assertEqual(self.player.assists, 1)
        
        # Simulate admin edit by modifying and saving directly
        stats.goals = 3
        stats.assists = 2
        stats.save()  # This should trigger the signal
        
        # Verify that signals triggered recalculation
        self.player.refresh_from_db()
        self.assertEqual(self.player.points, 20)  # 2 base + 3*4 + 2*3 = 20
        self.assertEqual(self.player.goals, 3)
        self.assertEqual(self.player.assists, 2)


class CaptainGameweekSnapshotTests(TestCase):
    """Gameweek captain lives on TeamSnapshot; Team.captain is the live selection for future weeks."""

    def test_snapshot_captain_unchanged_when_team_captain_changes(self):
        user = CustomUser.objects.create_user(email="cap@example.com", password="secret")
        squad = [
            Player.objects.create(name=f"P{i}", position="Midfielder", team="FC")
            for i in range(11)
        ]
        team = Team.objects.create(name="United", user=user)
        team.players.set(squad)
        team.captain = squad[0]
        team.save()

        today = date.today()
        gw = GameWeek.objects.create(
            week=42, start_date=today, end_date=today + timedelta(days=6)
        )
        snap = TeamSnapshot.objects.create(team=team, game_week=gw, weekly_points=0)
        snap.players.set(team.players.all())
        snap.captain = team.captain
        snap.save()

        team.captain = squad[1]
        team.save()

        snap.refresh_from_db()
        self.assertEqual(snap.captain_id, squad[0].id)
        self.assertEqual(team.captain_id, squad[1].id)

        _, created = TeamSnapshot.objects.get_or_create(
            team=team, game_week=gw, defaults={"weekly_points": 0}
        )
        self.assertFalse(created)
        snap.refresh_from_db()
        self.assertEqual(snap.captain_id, squad[0].id)


class PlayerGameStatsSnapshotRecalculationApiTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email="stats-admin@example.com", password="secret")
        self.client.force_authenticate(user=self.user)

        today = timezone.now().date()
        self.game_week = GameWeek.objects.create(
            week=3,
            start_date=today,
            end_date=today + timedelta(days=6),
        )
        self.player = Player.objects.create(name="Captain", position="Attacker", team="FC")
        self.squad = [self.player] + [
            Player.objects.create(name=f"Squad {i}", position="Midfielder", team="FC")
            for i in range(10)
        ]
        self.match = Match.objects.create(
            date=timezone.now(),
            team1="FC",
            team2="Opposition",
            team1_score=1,
            team2_score=0,
            game_week=self.game_week,
        )
        self.team = Team.objects.create(name="Fantasy Team", user=self.user)
        self.team.players.set(self.squad)
        self.team.captain = self.player
        self.team.save()
        self.snapshot = TeamSnapshot.objects.create(
            team=self.team,
            game_week=self.game_week,
            captain=self.player,
        )
        self.snapshot.players.set(self.squad)
        self.stat = PlayerGameStats.objects.create(
            player=self.player,
            match=self.match,
            goals=1,
            assists=0,
            yellow_cards=0,
            red_cards=0,
            clean_sheets=0,
            MOTM=0,
            Pen_Saves=0,
        )
        self.snapshot.weekly_points = self.snapshot.calculate_weekly_points()
        self.snapshot.save(update_fields=["weekly_points"])
        self.team.total_points = self.snapshot.weekly_points
        self.team.save(update_fields=["total_points"])

    def test_editing_player_game_stats_recalculates_snapshots_and_team_total(self):
        url = reverse("player_game_stats_detail", kwargs={"pk": self.stat.pk})
        res = self.client.put(
            url,
            {
                "player": self.player.id,
                "match": self.match.id,
                "goals": 2,
                "assists": 0,
                "yellow_cards": 0,
                "red_cards": 0,
                "clean_sheets": 0,
                "MOTM": 0,
                "Pen_Saves": 0,
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.stat.refresh_from_db()
        self.snapshot.refresh_from_db()
        self.team.refresh_from_db()

        self.assertEqual(self.stat.points, 10)
        self.assertEqual(self.snapshot.weekly_points, 20)
        self.assertEqual(self.team.total_points, 20)

    def test_creating_player_game_stats_recalculates_snapshots_and_team_total(self):
        player = self.squad[1]
        url = reverse("player_game_stats")
        res = self.client.post(
            url,
            {
                "player": player.id,
                "match": self.match.id,
                "goals": 1,
                "assists": 1,
                "yellow_cards": 0,
                "red_cards": 0,
                "clean_sheets": 1,
                "MOTM": 0,
                "Pen_Saves": 0,
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created_stat = PlayerGameStats.objects.get(pk=res.data["id"])
        self.snapshot.refresh_from_db()
        self.team.refresh_from_db()
        player.refresh_from_db()

        self.assertEqual(created_stat.points, 11)
        self.assertEqual(player.points, 11)
        self.assertEqual(self.snapshot.weekly_points, 23)
        self.assertEqual(self.team.total_points, 23)

    def test_deleting_player_game_stats_recalculates_snapshots_and_team_total(self):
        url = reverse("player_game_stats_detail", kwargs={"pk": self.stat.pk})
        res = self.client.delete(url)

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.snapshot.refresh_from_db()
        self.team.refresh_from_db()

        self.assertEqual(self.snapshot.weekly_points, 0)
        self.assertEqual(self.team.total_points, 0)
