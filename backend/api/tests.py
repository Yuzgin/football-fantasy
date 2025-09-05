from django.test import TestCase
from django.utils import timezone

from api.models import Player, Match
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
