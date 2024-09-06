from rest_framework import generics, viewsets
from .serializers import UserSerializer, PlayerSerializer, TeamSerializer, MatchSerializer, PlayerGameStatsSerializer, TeamSnapshotSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Player, Team, Match, PlayerGameStats, TeamSnapshot, GameWeek
import sys
from api.models import CustomUser, Team, Match
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.decorators import action


# Create your views here.

class PlayerListView(generics.ListCreateAPIView):
    serializer_class = PlayerSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Player.objects.all()



class PlayerDelete(generics.DestroyAPIView):
    serializer_class = PlayerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Player.objects.all()


class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        # Print username and password to terminal
        print(f"New user registration request - Email: {email}, Password: {password}", file=sys.stdout)
        return super().post(request, *args, **kwargs)


class TeamDetailOrCreateView(generics.GenericAPIView):
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        try:
            team = Team.objects.get(user=user)
            serializer = TeamSerializer(team, context={'team_creation_date': team.created_at})
            return Response(serializer.data)
        except Team.DoesNotExist:
            return Response({'message': 'You do not have a team. Please create one.'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, *args, **kwargs):
        user = request.user
        name = request.data.get('name')
        player_ids = request.data.get('players', [])

        if not player_ids or len(player_ids) != 11:
            return Response({'error': 'You must select exactly 11 players.'}, status=400)

        players = Player.objects.filter(id__in=player_ids)

        if players.count() != 11:
            return Response({'error': 'Invalid player selection.'}, status=400)

        team = Team.objects.create(name=name, user=user)
        team.players.set(players)
        team.save()

        serializer = TeamSerializer(team, context={'team_creation_date': team.created_at})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, *args, **kwargs):
        user = request.user
        try:
            team = Team.objects.get(user=user)
        except Team.DoesNotExist:
            return Response({'error': 'You do not have a team to update.'}, status=status.HTTP_404_NOT_FOUND)

        name = request.data.get('name', team.name)  # Use the current name if not provided
        player_ids = request.data.get('players', [])

        if not player_ids or len(player_ids) != 11:
            return Response({'error': 'You must select exactly 11 players.'}, status=400)

        players = Player.objects.filter(id__in=player_ids)

        if players.count() != 11:
            return Response({'error': 'Invalid player selection.'}, status=400)

        # Update team details
        team.name = name
        team.players.set(players)
        team.save()

        serializer = TeamSerializer(team, context={'team_creation_date': team.created_at})
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class TeamDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        try:
            team = Team.objects.get(user=user)
            team.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Team.DoesNotExist:
            return Response({'error': 'Team does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        

class MatchListCreateView(generics.ListCreateAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        match_serializer = self.get_serializer(data=request.data)
        match_serializer.is_valid(raise_exception=True)

        match_date = match_serializer.validated_data['date']
        
        # Find the correct GameWeek based on match date
        game_week = GameWeek.objects.filter(start_date__lte=match_date, end_date__gte=match_date).first()
        if not game_week:
            return Response({'error': 'No GameWeek found for the given match date.'}, status=400)

        match = match_serializer.save(game_week=game_week)

        players_stats = request.data.get('players_stats', [])
        for player_stat in players_stats:
            player_stat['match'] = match.id
            stat_serializer = PlayerGameStatsSerializer(data=player_stat)
            stat_serializer.is_valid(raise_exception=True)
            stat_serializer.save()

            # Update TeamSnapshot points for each player in the stat
            self.update_team_snapshot_points(stat_serializer.instance.player, match.game_week, stat_serializer.instance.points)

        headers = self.get_success_headers(match_serializer.data)
        return Response(match_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update_team_snapshot_points(self, player, game_week, points):
        # Find all snapshots in the game week that include this player
        team_snapshots = TeamSnapshot.objects.filter(players=player, game_week=game_week)

        for snapshot in team_snapshots:
            # Add the player's points to this snapshot's weekly points
            snapshot.weekly_points += points
            snapshot.save()

            # Recalculate and update the team's total points based on all snapshots
            team = snapshot.team
            team.total_points = sum(snapshot.weekly_points for snapshot in team.snapshots.all())
            team.save()


class MatchDeleteView(generics.DestroyAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        match = self.get_object()
        game_week = match.game_week

        # Get all player stats related to this match
        player_stats = PlayerGameStats.objects.filter(match=match)

        # Subtract points from the relevant team snapshots
        for stat in player_stats:
            self.update_team_snapshot_points_on_delete(stat.player, game_week, stat.points)

        # Delete player stats for this match
        player_stats.delete()

        # Now, delete the match
        match.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def update_team_snapshot_points_on_delete(self, player, game_week, points):
        # Find all snapshots in the game week that include this player
        team_snapshots = TeamSnapshot.objects.filter(players=player, game_week=game_week)

        for snapshot in team_snapshots:
            # Subtract the player's points from this snapshot's weekly points
            snapshot.weekly_points -= points
            if snapshot.weekly_points < 0:
                snapshot.weekly_points = 0  # Ensure points don't go negative
            snapshot.save()

            # Recalculate and update the team's total points based on all snapshots
            team = snapshot.team
            team.total_points = sum(snapshot.weekly_points for snapshot in team.snapshots.all())
            team.save()


class PlayerGameStatsListCreateView(generics.ListCreateAPIView):
    queryset = PlayerGameStats.objects.all()
    serializer_class = PlayerGameStatsSerializer
    permission_classes = [IsAuthenticated]

class PlayerGameStatsDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PlayerGameStats.objects.all()
    serializer_class = PlayerGameStatsSerializer
    permission_classes = [IsAuthenticated]

class TeamListView(generics.ListCreateAPIView):
    serializer_class = TeamSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Team.objects.all()

class TeamDetailView(generics.RetrieveAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [AllowAny]  # Or any other permission class you deem appropriate

    def get(self, request, *args, **kwargs):
        team_id = kwargs.get('pk')
        team = get_object_or_404(Team, id=team_id)
        serializer = TeamSerializer(team)
        return Response(serializer.data)

class TeamSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TeamSnapshotSerializer
    queryset = TeamSnapshot.objects.all()
    permission_classes = [AllowAny]

    def get_queryset(self):
        team_id = self.request.query_params.get('team_id')
        game_week_id = self.request.query_params.get('game_week_id')

        queryset = TeamSnapshot.objects.all()

        if team_id:
            queryset = queryset.filter(team_id=team_id)

        if game_week_id:
            queryset = queryset.filter(game_week_id=game_week_id)

        return queryset

    def retrieve(self, request, pk=None):
        team_id = request.query_params.get('team_id')
        game_week_id = request.query_params.get('game_week_id')
        snapshot = get_object_or_404(TeamSnapshot, team_id=team_id, game_week_id=game_week_id)
        serializer = self.get_serializer(snapshot)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def most_recent(self, request):
        team_id = request.query_params.get('team_id')
        if not team_id:
            return Response({"detail": "team_id query parameter is required."}, status=400)
        
        # Get the latest GameWeek based on end_date
        latest_gameweek = GameWeek.objects.order_by('-end_date').first()
        if not latest_gameweek:
            return Response({"detail": "No GameWeeks available."}, status=404)
        
        # Retrieve the TeamSnapshot for the team and latest GameWeek
        snapshot = TeamSnapshot.objects.filter(team_id=team_id, game_week=latest_gameweek).first()
        if not snapshot:
            return Response({"detail": "TeamSnapshot not found for the latest GameWeek."}, status=404)
        
        serializer = self.get_serializer(snapshot)
        return Response(serializer.data, status=200)