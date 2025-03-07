from django.core.management.base import BaseCommand
from api.models import Player, PlayerGameStats

class Command(BaseCommand):
    help = "Updates points for all players based on PlayerGameStats and Player model"

    def calculate_points(self, player):
        points = 0  # Start with zero points for each player

        # Get all PlayerGameStats for this player to calculate how many matches they played
        player_stats = PlayerGameStats.objects.filter(player=player)
        num_matches = player_stats.count()  # This will give the number of matches the player participated in

        # Add 2 points for each match played
        points += num_matches * 2

        # Now calculate the points based on the player's own stats
        if player.position == "Attacker":
            points += player.goals * 4 + player.assists * 3
        elif player.position == "Midfielder":
            points += player.goals * 5 + player.assists * 3 + player.clean_sheets * 1
        elif player.position == "Defender":
            points += player.goals * 6 + player.assists * 4 + player.clean_sheets * 4
        elif player.position == "Goalkeeper":
            points += player.goals * 8 + player.assists * 7 + player.clean_sheets * 5

        # Deduct points for yellow and red cards
        points -= player.yellow_cards * 1 + player.red_cards * 3

        return points

    def handle(self, *args, **kwargs):
        # Optionally filter by player name, for debugging or one-off updates
        player_name = "Quinn"  # Replace with the player's name you want to update
        
        # Uncomment the next line to target a specific player by name
        # players = Player.objects.filter(name=player_name)

        # In production, loop through all players
        players = Player.objects.all() if player_name == "name" else Player.objects.filter(name=player_name)

        for player in players:
            total_points = self.calculate_points(player)

            # Update player's points in the database
            player.points = total_points
            player.save()

            self.stdout.write(self.style.SUCCESS(f"Updated points for {player.name}: {total_points}"))
