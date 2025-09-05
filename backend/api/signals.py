from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import PlayerGameStats


@receiver(post_save, sender=PlayerGameStats)
def recalculate_player_totals_on_save(sender, instance, created, **kwargs):
    """Recalculate player totals when a PlayerGameStats instance is saved."""
    instance.player.recalculate_totals()


@receiver(post_delete, sender=PlayerGameStats)
def recalculate_player_totals_on_delete(sender, instance, **kwargs):
    """Recalculate player totals when a PlayerGameStats instance is deleted."""
    instance.player.recalculate_totals()
