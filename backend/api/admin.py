from django.contrib import admin
from .models import Player, CustomUser, Team, Match, PlayerGameStats

# Register your models here.
admin.site.register(Player)
admin.site.register(CustomUser)
admin.site.register(Match)
admin.site.register(PlayerGameStats) 

class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at', 'total_points')

admin.site.register(Team, TeamAdmin)
