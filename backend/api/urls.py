from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'team-snapshots', views.TeamSnapshotViewSet, basename='team-snapshots')

urlpatterns = [
    path('players/', views.PlayerListView.as_view(), name='players'),
    path('players/delete/<int:pk>/', views.PlayerDelete.as_view(), name='delete_player'),
    path('teams/', views.TeamListView.as_view(), name='teams'),
    path('team/', views.TeamDetailOrCreateView.as_view(), name='team-detail-or-create'),
    path('team/delete/', views.TeamDeleteView.as_view(), name='team-delete'),
    path('matches/', views.MatchListCreateView.as_view(), name='matches'),
    path('matches/delete/<int:pk>/', views.MatchDeleteView.as_view(), name='delete_match'),
    path('player-game-stats/', views.PlayerGameStatsListCreateView.as_view(), name='player_game_stats'),
    path('player-game-stats/<int:pk>/', views.PlayerGameStatsDetailView.as_view(), name='player_game_stats_detail'),
    path('game-weeks/', views.GameWeekListView.as_view(), name='game-weeks'),
    path('team/<int:pk>/', views.TeamDetailView.as_view(), name='team-detail'),
    path('', include(router.urls)),  # Include the router for team snapshots
]