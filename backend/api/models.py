from django.core.management.base import BaseCommand
from django.db.models import Sum
from api.models import Player, PlayerGameStats

class Command(BaseCommand):
    help = "Updates points for all players based on PlayerGameStats"

    def calculate_points(self, player, stats_totals):
        points = 0

        # Matches played is just the number of stat entries
        num_matches = stats_totals['match_count'] or 0
        points += num_matches * 2

        goals = stats_totals['goals'] or 0
        assists = stats_totals['assists'] or 0
        clean_sheets = stats_totals['clean_sheets'] or 0
        yellow_cards = stats_totals['yellow_cards'] or 0
        red_cards = stats_totals['red_cards'] or 0
        motm = stats_totals['MOTM'] or 0
        pen_saves = stats_totals['Pen_Saves'] or 0

        if player.position == "Attacker":
            points += goals * 4 + assists * 3
        elif player.position == "Midfielder":
            points += goals * 5 + assists * 3 + clean_sheets * 1
        elif player.position == "Defender":
            points += goals * 6 + assists * 4 + clean_sheets * 4
        elif player.position == "Goalkeeper":
            points += goals * 8 + assists * 7 + clean_sheets * 5 + pen_saves * 5

        points += motm * 2
        points -= yellow_cards * 1 + red_cards * 3

        return points, num_matches

    def handle(self, *args, **kwargs):
        players = Player.objects.all()

        for player in players:
            stats = PlayerGameStats.objects.filter(player=player)
            totals = stats.aggregate(
                goals=Sum('goals'),
                assists=Sum('assists'),
                yellow_cards=Sum('yellow_cards'),
                red_cards=Sum('red_cards'),
                clean_sheets=Sum('clean_sheets'),
                MOTM=Sum('MOTM'),
                Pen_Saves=Sum('Pen_Saves'),
                match_count=Sum('id')  # We'll count the actual queryset length
            )
            totals['match_count'] = stats.count()  # Actual match count

            total_points, games_played = self.calculate_points(player, totals)

            player.points = total_points
            player.games_played = games_played
            player.goals = totals['goals'] or 0
            player.assists = totals['assists'] or 0
            player.clean_sheets = totals['clean_sheets'] or 0
            player.yellow_cards = totals['yellow_cards'] or 0
            player.red_cards = totals['red_cards'] or 0
            player.MOTM = totals['MOTM'] or 0
            player.Pen_Saves = totals['Pen_Saves'] or 0
            player.save()

            self.stdout.write(self.style.SUCCESS(f"Updated {player.name}: {total_points} pts"))
