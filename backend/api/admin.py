from django.contrib import admin
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
    )
    ordering = ('-points',)            # sort by points descending
    search_fields = ['name']   # handy for finding specific players
    actions = ['recalculate_player_totals_action']
    
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
