from django.core.management.base import BaseCommand
from api.models import Player


class Command(BaseCommand):
    help = "Recalculates totals for all players based on their PlayerGameStats"

    def handle(self, *args, **options):
        players = Player.objects.all()
        updated_count = 0
        
        for player in players:
            player.recalculate_totals()
            updated_count += 1
            self.stdout.write(f"Updated {player.name}: {player.points} points")
        
        self.stdout.write(
            self.style.SUCCESS(f"Successfully recalculated totals for {updated_count} players.")
        )
