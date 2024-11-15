from rest_framework import generics, viewsets
from .serializers import UserSerializer, PlayerSerializer, TeamSerializer, MatchSerializer
from .serializers import PlayerGameStatsSerializer, TeamSnapshotSerializer, GameWeekSerializer
from .serializers import FixtureSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Player, Team, Match, PlayerGameStats, TeamSnapshot, GameWeek, Fixture
import sys
from api.models import CustomUser, Team, Match
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
import logging
from django.utils import timezone
from django.db.models import Q
from django.utils.timezone import now



# Create your views here.

class PlayerListView(generics.ListCreateAPIView):
    serializer_class = PlayerSerializer
    permission_classes = [AllowAny]

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
        # PREVIOUS CODE
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

        # NEW TEMPORARY CODE: Create a snapshot in the current game week
        current_game_week = GameWeek.objects.filter(
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date()
        ).first()

        if current_game_week:
            # Create a snapshot for the team
            snapshot = TeamSnapshot.objects.create(
                team=team,
                game_week=current_game_week,
                weekly_points=0  # Initialize weekly points to 0
            )
            snapshot.players.set(players)  # Add players to the snapshot
            snapshot.save()

        # PREVIOUS CODE CONTINUES
        serializer = TeamSerializer(team, context={'team_creation_date': team.created_at})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, *args, **kwargs):
        # OLD CODE: Fetch the user's team
        user = request.user
        try:
            team = Team.objects.get(user=user)
        except Team.DoesNotExist:
            return Response({'error': 'You do not have a team to update.'}, status=status.HTTP_404_NOT_FOUND)

        # OLD CODE: Validate and update the team details
        name = request.data.get('name', team.name)  # Use the current name if not provided
        player_ids = request.data.get('players', [])

        if not player_ids or len(player_ids) != 11:
            return Response({'error': 'You must select exactly 11 players.'}, status=400)

        players = Player.objects.filter(id__in=player_ids)

        if players.count() != 11:
            return Response({'error': 'Invalid player selection.'}, status=400)

        # OLD CODE: Update the team in the database
        team.name = name
        team.players.set(players)
        team.save()

        # NEW CODE: Handle snapshot creation or update
        current_game_week = GameWeek.objects.filter(
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date()
        ).first()

        if current_game_week:
            # Check if a snapshot for the current game week already exists
            snapshot = TeamSnapshot.objects.filter(team=team, game_week=current_game_week).first()

            if snapshot:
                # Update the existing snapshot
                snapshot.players.set(players)
                snapshot.weekly_points = 0  # Reset weekly points if necessary
                snapshot.save()
            else:
                # Create a new snapshot
                snapshot = TeamSnapshot.objects.create(
                    team=team,
                    game_week=current_game_week,
                    weekly_points=0  # Initialize weekly points to 0
                )
                snapshot.players.set(players)
                snapshot.save()

        # OLD CODE: Return the updated team data
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
        logger = logging.getLogger(__name__)  # Initialize the logger

        logger.info("Incoming request data: %s", request.data)  # Log the incoming request data

        match_serializer = self.get_serializer(data=request.data)
        match_serializer.is_valid(raise_exception=True)
        
        match_date = match_serializer.validated_data['date']
        logger.info("Match date: %s", match_date)  # Log the match date
        
        # Find the correct GameWeek based on match date
        game_week = GameWeek.objects.filter(start_date__lte=match_date, end_date__gte=match_date).first()
        if not game_week:
            logger.error("No GameWeek found for the given match date: %s", match_date)
            return Response({'error': 'No GameWeek found for the given match date.'}, status=400)

        logger.info("GameWeek found: %s", game_week)  # Log the found game_week

        match = match_serializer.save(game_week=game_week)
        logger.info("Match created: %s", match)  # Log the created match

        players_stats = request.data.get('players_stats', [])
        for player_stat in players_stats:
            logger.info("Player stat before saving: %s", player_stat)  # Log each player stat before saving
            player_stat['match'] = match.id

            # Create player stats and automatically calculate points
            stat_serializer = PlayerGameStatsSerializer(data=player_stat)
            stat_serializer.is_valid(raise_exception=True)
            stat_instance = stat_serializer.save()

            logger.info("Player stat saved: %s", stat_instance)  # Log the saved player stat

            # Update TeamSnapshot points for each player in the stat
            self.update_team_snapshot_points(stat_instance.player, match.game_week, stat_instance.points)

            # Update the Player model's fields
            self.update_player_totals(stat_instance)

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

    def update_player_totals(self, stat_instance):
        """
        Update the Player model's total fields (goals, assists, games played, etc.).
        """
        player = stat_instance.player
        player.goals += stat_instance.goals
        player.assists += stat_instance.assists
        player.yellow_cards += stat_instance.yellow_cards
        player.red_cards += stat_instance.red_cards
        player.clean_sheets += stat_instance.clean_sheets
        player.games_played += 1  # Increment games played
        player.save()


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

    def get_serializer_context(self):
        # Pass the request object to the serializer's context
        context = super().get_serializer_context()
        context.update({
            'request': self.request
        })
        return context


class PlayerGameStatsDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PlayerGameStats.objects.all()
    serializer_class = PlayerGameStatsSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        # Pass the request object to the serializer's context
        context = super().get_serializer_context()
        context.update({
            'request': self.request
        })
        return context


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

class GameWeekListView(generics.ListAPIView):
    serializer_class = GameWeekSerializer

    def get_queryset(self):
        week = self.request.query_params.get('week')
        if week:
            return GameWeek.objects.filter(week=week)
        return GameWeek.objects.all()
    

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
        
        # Fetch the current date
        today = timezone.now().date()
        
        # Get the GameWeek that includes today's date
        current_gameweek = GameWeek.objects.filter(
            Q(start_date=today) | (Q(start_date__lte=today) & Q(end_date__gte=today))
            ).order_by('-start_date').first()

        if not current_gameweek:
            return Response({"detail": "No current GameWeek found."}, status=404)
        
        # Retrieve the TeamSnapshot for the team and current GameWeek
        snapshot = TeamSnapshot.objects.filter(team_id=team_id, game_week=current_gameweek).first()
        if not snapshot:
            return Response({"detail": "TeamSnapshot not found for the current GameWeek."}, status=404)
        
        serializer = self.get_serializer(snapshot)
        return Response(serializer.data, status=200)


class FixtureListView(generics.ListAPIView):
    """
    Handle GET requests for listing fixtures.
    Supports filtering for upcoming fixtures.
    """
    serializer_class = FixtureSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        upcoming_only = self.request.query_params.get('upcoming', None)
        today = now().date()

        if upcoming_only:
            return Fixture.objects.filter(date__gte=today).order_by('date')[:8]
        return Fixture.objects.all()