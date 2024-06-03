# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('players/', views.PlayerListView.as_view(), name='players'),
    path('players/delete/<int:pk>/', views.PlayerDelete.as_view(), name='delete_player'),
    path('team/', views.TeamDetailOrCreateView.as_view(), name='team-detail-or-create'),
    path('team/delete/', views.TeamDeleteView.as_view(), name='team-delete'),
    path('matches/', views.MatchListCreateView.as_view(), name='matches'),
    path('matches/delete/<int:pk>/', views.MatchDeleteView.as_view(), name='delete_match'),
    path('player-game-stats/', views.PlayerGameStatsListCreateView.as_view(), name='player_game_stats'),
    path('player-game-stats/<int:pk>/', views.PlayerGameStatsDetailView.as_view(), name='player_game_stats_detail'),
]
