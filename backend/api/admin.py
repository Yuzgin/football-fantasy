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
        'price',
        'points',
    )
    ordering = ('-points',)            # sort by points descending
    search_fields = ['name']   # handy for finding specific players

# --- Other models (unchanged) ---
admin.site.register(CustomUser)
admin.site.register(Match)
@admin.register(PlayerGameStats)
class PlayerGameStatsAdmin(admin.ModelAdmin):
    def save_model(self, request, obj, form, change):
        obj.save()

    def delete_model(self, request, obj):
        obj.delete()
admin.site.register(GameWeek)
admin.site.register(TeamSnapshot)
admin.site.register(Fixture)

# --- Team admin (as you already have it) ---
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at', 'total_points')
