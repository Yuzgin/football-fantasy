from django.core.management.base import BaseCommand
from api.models import Player, Team, TeamSnapshot


class Command(BaseCommand):
    help = 'Adds points to all TeamSnapshots that include a player (captain gets double the delta)'

    def handle(self, *args, **kwargs):
        player_name = Player.objects.filter(name="J.Irving")

        if not player_name.exists():
            self.stdout.write(self.style.WARNING('No players named Player found.'))
            return

        affected_snapshots = TeamSnapshot.objects.filter(players__in=player_name).distinct()

        if not affected_snapshots.exists():
            self.stdout.write(self.style.WARNING('No TeamSnapshots contain Player.'))
            return

        base_delta = 2
        player_ids = set(player_name.values_list('pk', flat=True))
        teams_updated = set()

        for snapshot in affected_snapshots.select_related('team'):
            delta = base_delta * 2 if snapshot.captain_id in player_ids else base_delta
            snapshot.weekly_points += delta
            snapshot.save()
            teams_updated.add(snapshot.team_id)

        for team_id in teams_updated:
            team = Team.objects.get(pk=team_id)
            team.total_points = sum(s.weekly_points for s in team.snapshots.all())
            team.save()

        self.stdout.write(self.style.SUCCESS(f"Updated {affected_snapshots.count()} TeamSnapshots by adding points."))