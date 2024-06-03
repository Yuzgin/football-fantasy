from datetime import timedelta
from api.models import Player
from rest_framework import serializers
from api.models import CustomUser, Player, Team, Match, PlayerGameStats

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password']
        extra_kwargs = { 'password': { 'write_only': True } }

    def create(self, validated_data):
            print(validated_data)
            user = CustomUser.objects.create_user(**validated_data)
            return user

class PlayerSerializer(serializers.ModelSerializer):
    points = serializers.SerializerMethodField()

    class Meta:
        model = Player
        fields = ["id", "name", "position", "points"]

    def get_points(self, player):
        team_creation_date = self.context.get('team_creation_date')
        if team_creation_date:
            team_creation_date = team_creation_date.date() + timedelta(days=1)
            stats = PlayerGameStats.objects.filter(player=player, match__date__gte=team_creation_date)
            return sum(stat.points for stat in stats)
        return 0

class TeamSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    total_points = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'players', 'total_points', 'created_at']

    def get_total_points(self, team):
        total_points = 0
        team_creation_date = team.created_at.date() + timedelta(days=1)
        for player in team.players.all():
            stats = PlayerGameStats.objects.filter(player=player, match__date__gte=team_creation_date)
            total_points += sum(stat.points for stat in stats)
        return total_points

    class Meta:
        model = Team
        fields = ['id', 'name', 'players', 'total_points', 'created_at']

    def get_total_points(self, team):
        total_points = 0
        team_creation_date = team.created_at.date() + timedelta(days=1)
        for player in team.players.all():
            stats = PlayerGameStats.objects.filter(player=player, match__date__gte=team_creation_date)
            total_points += sum(stat.points for stat in stats)
        return total_points

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['id', 'date', 'team1', 'team2']

class PlayerGameStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerGameStats
        fields = ['id', 'player', 'match', 'goals', 'assists', 'yellow_cards', 'red_cards', 'clean_sheets', 'points']

