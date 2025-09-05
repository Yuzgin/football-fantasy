from django.contrib import admin
from django import forms
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

# Custom form for PlayerGameStats to ensure points are calculated
class PlayerGameStatsForm(forms.ModelForm):
    class Meta:
        model = PlayerGameStats
        fields = '__all__'
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        # Calculate points before saving
        instance.points = instance.calculate_points()
        if commit:
            instance.save()
        return instance

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
    form = PlayerGameStatsForm
    list_display = ('player', 'match', 'goals', 'assists', 'points')
    list_filter = ('player', 'match')
    search_fields = ('player__name', 'match__team1', 'match__team2')
    actions = ['recalculate_player_totals']
    
    def save_model(self, request, obj, form, change):
        # Store the player before saving
        old_player = None
        if change and obj.pk:
            try:
                old_player = PlayerGameStats.objects.get(pk=obj.pk).player
            except PlayerGameStats.DoesNotExist:
                pass
        
        obj.save()
        
        # Manually trigger recalculation for both old and new players
        if old_player and old_player != obj.player:
            old_player.recalculate_totals()
        obj.player.recalculate_totals()

    def delete_model(self, request, obj):
        player = obj.player
        obj.delete()
        player.recalculate_totals()
    
    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        
        # After saving related objects, recalculate totals for the player
        if hasattr(form, 'instance') and form.instance and hasattr(form.instance, 'player'):
            form.instance.player.recalculate_totals()
    
    def response_add(self, request, obj, post_url_continue=None):
        """Override to ensure totals are recalculated after adding"""
        response = super().response_add(request, obj, post_url_continue)
        if hasattr(obj, 'player'):
            obj.player.recalculate_totals()
        return response
    
    def response_change(self, request, obj):
        """Override to ensure totals are recalculated after changing"""
        response = super().response_change(request, obj)
        if hasattr(obj, 'player'):
            obj.player.recalculate_totals()
        return response
    
    def recalculate_player_totals(self, request, queryset):
        """Admin action to manually recalculate player totals"""
        players_updated = set()
        for stats in queryset:
            if stats.player not in players_updated:
                stats.player.recalculate_totals()
                players_updated.add(stats.player)
        
        self.message_user(
            request,
            f"Recalculated totals for {len(players_updated)} players."
        )
    recalculate_player_totals.short_description = "Recalculate player totals"
admin.site.register(GameWeek)
admin.site.register(TeamSnapshot)
admin.site.register(Fixture)

# --- Team admin (as you already have it) ---
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at', 'total_points')
