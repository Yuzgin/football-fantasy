from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Team, TeamSnapshot, GameWeek
from django.db import transaction

class Command(BaseCommand):
    help = 'Create or update team snapshots for the current game week'

    def handle(self, *args, **kwargs):
        # Fetch the current game week
        current_game_week = GameWeek.get_current_game_week()

        if not current_game_week:
            self.stdout.write(self.style.ERROR('No current game week found.'))
            return

        # Get all teams
        teams = Team.objects.all()

        with transaction.atomic():
            for team in teams:
                # Ensure that a snapshot exists for the current game week
                snapshot, created = TeamSnapshot.objects.get_or_create(
                    team=team,
                    game_week=current_game_week,
                    defaults={'weekly_points': 0}
                )

                # Roster and captain apply per gameweek: copy from the team only when the snapshot
                # is first created. Later team changes (transfers, captain) affect the next
                # gameweek's snapshot once that week becomes current.
                if created:
                    snapshot.players.set(team.players.all())
                    snapshot.captain = team.captain
                    snapshot.save()

                # Calculate the total points for the team
                team.total_points = sum(snapshot.weekly_points for snapshot in team.snapshots.all())
                team.save()

                if created:
                    self.stdout.write(self.style.SUCCESS(f'Successfully created snapshot for team: {team.name}'))
                else:
                    self.stdout.write(self.style.SUCCESS(f'Successfully updated snapshot for team: {team.name}'))

        self.stdout.write(self.style.SUCCESS('All team snapshots have been processed successfully.'))
