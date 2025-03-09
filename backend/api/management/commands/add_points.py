from django.core.management.base import BaseCommand
from api.models import Player, TeamSnapshot

class Command(BaseCommand):
    help = 'Adds points to all TeamSnapshots that include a player'

    def handle(self, *args, **kwargs):
        # Fetch the player named "Quinn"
        player_name = Player.objects.filter(name="JJ")  # Replace with the player's name you want to update

        if not player_name.exists():
            self.stdout.write(self.style.WARNING('No players named Player found.'))
            return

        # Get all team snapshots that include "Quinn"
        affected_snapshots = TeamSnapshot.objects.filter(players__in=player_name).distinct()

        if not affected_snapshots.exists():
            self.stdout.write(self.style.WARNING('No TeamSnapshots contain Player.'))
            return

        # Update weekly_points for each affected snapshot
        for snapshot in affected_snapshots:
            snapshot.weekly_points += 2
            snapshot.save()

        self.stdout.write(self.style.SUCCESS(f"Updated {affected_snapshots.count()} TeamSnapshots by adding points."))