from django.core.management.base import BaseCommand
from api.models import Player

class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        # Fetch all players with abbreviated names
        players = Player.objects.filter(name__isnull=False).exclude(name='')

        if not players.exists():
            self.stdout.write(self.style.WARNING('No players with abbreviated names found.'))
            return

        # Update each player's full_name to full_name if available
        updated_count = 0
        for player in players:
                player.full_name = player.name
                player.save()
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(f"Updated {updated_count} player names to full names."))