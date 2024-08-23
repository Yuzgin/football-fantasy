from rest_framework import generics
from .serializers import UserSerializer, PlayerSerializer, TeamSerializer, MatchSerializer, PlayerGameStatsSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Player, Team, Match, PlayerGameStats
import sys
from api.models import CustomUser, Team, Match
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView


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
        match = match_serializer.save()

        players_stats = request.data.get('players_stats', [])
        for player_stat in players_stats:
            player_stat['match'] = match.id
            stat_serializer = PlayerGameStatsSerializer(data=player_stat)
            stat_serializer.is_valid(raise_exception=True)
            stat_serializer.save()

        headers = self.get_success_headers(match_serializer.data)
        return Response(match_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class MatchDeleteView(generics.DestroyAPIView):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

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