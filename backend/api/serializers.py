from datetime import timedelta
from rest_framework import serializers
from api.models import CustomUser, Player, Team, Match, PlayerGameStats, GameWeek, TeamSnapshot

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email address is already in use.")
        return value

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['id', 'date', 'team1', 'team2', 'game_week']


class PlayerGameStatsSerializer(serializers.ModelSerializer):
    match = serializers.PrimaryKeyRelatedField(queryset=Match.objects.all())

    class Meta:
        model = PlayerGameStats
        fields = ['id', 'player', 'match', 'goals', 'assists', 'yellow_cards', 'red_cards', 'clean_sheets', 'points']

class PlayerSerializer(serializers.ModelSerializer):
    points = serializers.SerializerMethodField()
    game_stats = PlayerGameStatsSerializer(many=True, read_only=True)

    class Meta:
        model = Player
        fields = ["id", "name", "position", "points", "price", "team", "game_stats"]

    def get_points(self, player):
        game_week = self.context.get('game_week')
        if game_week:
            stats = PlayerGameStats.objects.filter(
                player=player,
                match__date__gte=game_week.start_date,
                match__date__lte=game_week.end_date
            )
            return sum(stat.points for stat in stats)
        return 0

class TeamSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    total_points = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'players', 'total_points', 'created_at']

    def get_total_points(self, team):
        # Sum the weekly points from all snapshots related to this team
        total_points = sum(snapshot.weekly_points for snapshot in team.snapshots.all())
        return total_points


class TeamSnapshotSerializer(serializers.ModelSerializer):
    players = serializers.SerializerMethodField()
    game_week = serializers.SerializerMethodField()
    team = TeamSerializer()

    class Meta:
        model = TeamSnapshot
        fields = ['team', 'game_week', 'snapshot_date', 'players', 'weekly_points']

    def get_players(self, obj):
        player_serializer = PlayerSerializer(obj.players.all(), many=True, context={'game_week': obj.game_week})
        return player_serializer.data

    def get_game_week(self, obj):
        return {
            "week": obj.game_week.week,
            "start_date": obj.game_week.start_date,
            "end_date": obj.game_week.end_date,
        }

    def update(self, instance, validated_data):
        instance.weekly_points = sum(stat.points for stat in instance.players.all())
        instance.save()

        # Update total team points
        team = instance.team
        team.total_points = sum(snapshot.weekly_points for snapshot in team.snapshots.all())
        team.save()

        return instance
