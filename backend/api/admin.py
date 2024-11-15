from django.contrib import admin
from api.models import CustomUser, Player, Team, Match, PlayerGameStats, GameWeek, TeamSnapshot
from api.models import Fixture

# Register your models here.
admin.site.register(Player)
admin.site.register(CustomUser)
admin.site.register(Match)
admin.site.register(PlayerGameStats)
admin.site.register(GameWeek)
admin.site.register(TeamSnapshot)
admin.site.register(Fixture)


class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at', 'total_points')

admin.site.register(Team, TeamAdmin)
