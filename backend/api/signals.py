from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.db import transaction
from .models import PlayerGameStats, Player


@receiver(post_save, sender=PlayerGameStats)
def recalculate_player_totals_on_save(sender, instance, created, **kwargs):
    """Recalculate player totals when a PlayerGameStats instance is saved."""
    # Use transaction.on_commit to ensure this runs after the transaction is committed
    transaction.on_commit(lambda: instance.player.recalculate_totals())


@receiver(post_delete, sender=PlayerGameStats)
def recalculate_player_totals_on_delete(sender, instance, **kwargs):
    """Recalculate player totals when a PlayerGameStats instance is deleted."""
    # Use transaction.on_commit to ensure this runs after the transaction is committed
    transaction.on_commit(lambda: instance.player.recalculate_totals())


@receiver(m2m_changed, sender=Player.team_players.through)
def recalculate_player_totals_on_team_change(sender, instance, action, **kwargs):
    """Recalculate player totals when team relationships change."""
    if action in ['post_add', 'post_remove', 'post_clear']:
        # Recalculate totals for all affected players
        for player in instance.players.all():
            transaction.on_commit(lambda p=player: p.recalculate_totals())
