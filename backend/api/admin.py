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
@admin.register(PlayerGameStats)
class PlayerGameStatsAdmin(admin.ModelAdmin):
    form = PlayerGameStatsForm
    list_display = ('player', 'match', 'goals', 'assists', 'points')
    list_filter = ('player', 'match')
    search_fields = ('player__name', 'match__team1', 'match__team2')
    actions = ['recalculate_player_totals', 'force_recalculate_all_players']
    list_editable = ('goals', 'assists', 'yellow_cards', 'red_cards', 'clean_sheets', 'MOTM', 'Pen_Saves')
    
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
    
    def force_recalculate_all_players(self, request, queryset):
        """Admin action to recalculate ALL player totals"""
        from api.models import Player
        players = Player.objects.all()
        for player in players:
            player.recalculate_totals()
        
        self.message_user(
            request,
            f"Recalculated totals for ALL {players.count()} players."
        )
    force_recalculate_all_players.short_description = "Recalculate ALL player totals"
    
    def changelist_view(self, request, extra_context=None):
        """Override changelist to handle bulk edits"""
        if request.method == 'POST' and '_save' in request.POST:
            # This handles bulk edits from the changelist
            response = super().changelist_view(request, extra_context)
            
            # After bulk save, recalculate all affected players
            self._recalculate_all_players()
            
            return response
        
        return super().changelist_view(request, extra_context)
    
    def _recalculate_all_players(self):
        """Helper method to recalculate all player totals"""
        from api.models import Player
        players = Player.objects.filter(game_stats__isnull=False).distinct()
        for player in players:
            player.recalculate_totals()
    
    def get_queryset(self, request):
        """Override to use custom queryset"""
        return super().get_queryset(request)
admin.site.register(GameWeek)
admin.site.register(TeamSnapshot)
admin.site.register(Fixture)

# --- Team admin (as you already have it) ---
@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at', 'total_points')
