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
    game_week = serializers.SerializerMethodField()
    match = serializers.PrimaryKeyRelatedField(queryset=Match.objects.all())  # Default for PUT/POST

    class Meta:
        model = PlayerGameStats
        fields = ['id', 'player', 'match', 'goals', 'assists', 'yellow_cards', 'red_cards', 'clean_sheets', 'points', 'game_week']

    def get_game_week(self, obj):
        return obj.match.game_week.id if obj.match and obj.match.game_week else None

    def calculate_points(self, player, goals, assists, yellow_cards, red_cards, clean_sheets):
        # Start with 2 base points for everyone
        points = 2

        # Points logic based on the player's position
        if player.position == "Attacker":
            points += goals * 4
            points += assists * 3
        elif player.position == "Midfielder":
            points += goals * 5
            points += assists * 3
            points += clean_sheets * 1
        elif player.position == "Defender":
            points += goals * 6
            points += assists * 4
            points += clean_sheets * 3
        elif player.position == "Goalkeeper":
            points += goals * 8
            points += assists * 7
            points += clean_sheets * 5

        # Subtract points for cards
        points -= red_cards * 3
        points -= yellow_cards * 1

        return points

    def create(self, validated_data):
        # Calculate points before saving the player stats
        player = validated_data['player']
        goals = validated_data['goals']
        assists = validated_data['assists']
        yellow_cards = validated_data['yellow_cards']
        red_cards = validated_data['red_cards']
        clean_sheets = validated_data['clean_sheets']

        # Call the points calculation method
        validated_data['points'] = self.calculate_points(player, goals, assists, yellow_cards, red_cards, clean_sheets)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        In PUT requests, keep the match unchanged.
        """
        validated_data.pop('match', None)  # Remove match if present
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """
        Customize the GET and POST response to return full match details.
        """
        representation = super().to_representation(instance)
        request = self.context.get('request')  # Safely get the request object
        if request and request.method in ['GET', 'POST']:
            # Replace match field with full match details
            match_serializer = MatchSerializer(instance.match)
            representation['match'] = match_serializer.data
        return representation


class PlayerSerializer(serializers.ModelSerializer):
    points = serializers.SerializerMethodField()
    game_stats = PlayerGameStatsSerializer(many=True, read_only=True)

    class Meta:
        model = Player
        fields = [
            "id", "name", "position", "points", "price", "team",
            "game_stats", "goals", "assists", "clean_sheets", "games_played",
        ]

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


class GameWeekSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameWeek
        fields = ['id', 'week', 'start_date', 'end_date']


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
            "id": obj.game_week.id,
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
