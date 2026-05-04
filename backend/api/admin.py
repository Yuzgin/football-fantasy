from django.contrib import admin
from django.db.models import Count
from api.models import (
    CustomUser,
    Player,
    Team,
    Match,
    PlayerGameStats,
    GameWeek,
    TeamSnapshot,
    Fixture,
)

# --- Player admin with custom list_display and ordering ---
@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'full_name',
        'price',
        'points',
        'goals',
        'assists',
        'games_played',
        'pick_percentage',
    )
    ordering = ('-points',)            # sort by points descending
    search_fields = ['name']   # handy for finding specific players
    readonly_fields = ('pick_percentage',)
    actions = ['recalculate_player_totals_action']

    def get_queryset(self, request):
        """Annotate pick counts so the changelist does not N+1 on Team M2M."""
        self._fantasy_team_total = Team.objects.count()
        return (
            super()
            .get_queryset(request)
            .annotate(_fantasy_teams_with_player=Count('team_players', distinct=True))
        )

    def pick_percentage(self, obj):
        """Share of fantasy teams (Team rows) whose squad includes this player."""
        total = getattr(self, '_fantasy_team_total', None)
        if total is None:
            total = Team.objects.count()
        picked = getattr(obj, '_fantasy_teams_with_player', None)
        if picked is None and getattr(obj, 'pk', None):
            picked = obj.team_players.count()
        picked = picked or 0
        if total == 0:
            return '— (no teams yet)'
        pct = 100.0 * picked / total
        return f'{pct:.1f}% ({picked} of {total} teams)'

    pick_percentage.short_description = '% of teams picked'
    pick_percentage.admin_order_by = '_fantasy_teams_with_player'
    
    def recalculate_player_totals_action(self, request, queryset):
        """Admin action to recalculate player totals"""
        for player in queryset:
            player.recalculate_totals()
        
        self.message_user(
            request,
            f"Recalculated totals for {queryset.count()} players."
        )
    recalculate_player_totals_action.short_description = "Recalculate selected player totals"

# --- Other models (unchanged) ---
admin.site.register(CustomUser)
admin.site.register(Match)

admin.site.register(PlayerGameStats)
admin.site.register(GameWeek)
admin.site.register(TeamSnapshot)
admin.site.register(Fixture)

# --- Team admin (as you already have it) ---
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at', 'total_points')
