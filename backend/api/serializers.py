from datetime import timedelta
from rest_framework import serializers
from api.models import CustomUser, Player, Team, Match, PlayerGameStats, GameWeek, TeamSnapshot, Fixture, WomensFixture
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password', 'is_staff']
        extra_kwargs = {'password': {'write_only': True}}
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email address is already in use.")
        return value

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user
    
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user is associated with this email address.")
        return value

    def send_reset_email(self):
        """Sends password reset email with token and UID"""
        email = self.validated_data["email"]
        user = User.objects.get(email=email)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"https://langwithfootball.com/reset-password/{uid}/{token}/"

        # 🔹 Debug: Print email credentials before sending
        # print("EMAIL_HOST_USER:", settings.EMAIL_HOST_USER)
        # print("EMAIL_HOST_PASSWORD:", settings.EMAIL_HOST_PASSWORD)  # ⚠️ Be careful in production

        send_mail(
            "Password Reset Request",
            f"Click the link below to reset your password:\n\n{reset_url}",
            "no-reply@langwithfootball.com",
            [email],
            fail_silently=False,
        )

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, data):
        try:
            uid = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid token")

        if not default_token_generator.check_token(user, data["token"]):
            raise serializers.ValidationError("Token is invalid or expired")

        user.set_password(data["new_password"])
        user.save()
        return data

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['id', 'date', 'team1', 'team2', 'team1_score', 'team2_score', 'game_week']


class PlayerGameStatsSerializer(serializers.ModelSerializer):
    game_week = serializers.SerializerMethodField()
    match = serializers.PrimaryKeyRelatedField(queryset=Match.objects.all())  # Default for PUT/POST
    points = serializers.IntegerField(read_only=True)

    class Meta:
        model = PlayerGameStats
        fields = ['id', 'player', 'match', 'goals', 'assists', 'yellow_cards', 'red_cards', 'clean_sheets',
                  'points', 'game_week', 'MOTM', 'Pen_Saves']

    def get_game_week(self, obj):
        return obj.match.game_week.id if obj.match and obj.match.game_week else None

    def calculate_points(self, player, goals, assists, yellow_cards, red_cards, clean_sheets, MOTM, Pen_Saves):
        # Custom points calculation logic
        points = 2  # Base points for all players
        if player.position == "Attacker":
            points += goals * 4 + assists * 3
        elif player.position == "Midfielder":
            points += goals * 5 + assists * 3 + clean_sheets * 1
        elif player.position == "Defender":
            points += goals * 6 + assists * 4 + clean_sheets * 4
        elif player.position == "Goalkeeper":
            points += goals * 8 + assists * 5 + clean_sheets * 5
        points -= yellow_cards * 1 + red_cards * 3
        points += MOTM * 2 + Pen_Saves * 5
        return points

    def create(self, validated_data):
        # Calculate points before saving the player stats
        player = validated_data['player']
        points = self.calculate_points(
            player,
            validated_data['goals'],
            validated_data['assists'],
            validated_data['yellow_cards'],
            validated_data['red_cards'],
            validated_data['clean_sheets'],
            validated_data['MOTM'],
            validated_data['Pen_Saves'],
        )
        validated_data['points'] = points
        return super().create(validated_data)

    def update(self, instance, validated_data):
        player = validated_data.get('player', instance.player)
        new_points = self.calculate_points(
            player,
            validated_data.get('goals', instance.goals),
            validated_data.get('assists', instance.assists),
            validated_data.get('yellow_cards', instance.yellow_cards),
            validated_data.get('red_cards', instance.red_cards),
            validated_data.get('clean_sheets', instance.clean_sheets),
            validated_data.get('MOTM', instance.MOTM),
            validated_data.get('Pen_Saves', instance.Pen_Saves),
        )
        validated_data['points'] = new_points
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
            "points", "yellow_cards", "red_cards", "MOTM", "Pen_Saves"
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
    
class PlayerPointsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'name', 'points']

class PlayerGoalsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'name', 'goals']


class TeamSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    captain = PlayerSerializer(read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'players', 'captain', 'total_points', 'created_at']


class GameWeekSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameWeek
        fields = ['id', 'week', 'start_date', 'end_date']


class TeamSnapshotSerializer(serializers.ModelSerializer):
    players = serializers.SerializerMethodField()
    captain = serializers.SerializerMethodField()
    game_week = serializers.SerializerMethodField()
    team = serializers.SerializerMethodField()

    class Meta:
        model = TeamSnapshot
        fields = ['team', 'game_week', 'snapshot_date', 'players', 'captain', 'weekly_points']

    def get_players(self, obj):
        # Use optimized player data with pre-calculated points
        players_data = []
        for player in obj.players.all():
            game_week_points = self._calculate_player_game_week_points(player, obj.game_week)
            if obj.captain_id and player.id == obj.captain_id:
                game_week_points *= 2

            player_data = {
                'id': player.id,
                'name': player.name,
                'position': player.position,
                'price': player.price,
                'team': player.team,
                'points': game_week_points,
                'goals': player.goals,
                'assists': player.assists,
                'clean_sheets': player.clean_sheets,
                'games_played': player.games_played,
                'yellow_cards': player.yellow_cards,
                'red_cards': player.red_cards,
                'MOTM': player.MOTM,
                'Pen_Saves': player.Pen_Saves,
                'game_stats': []  # Empty since we don't need all game stats
            }
            players_data.append(player_data)
        return players_data

    def get_captain(self, obj):
        if obj.captain:
            gw_points = self._calculate_player_game_week_points(obj.captain, obj.game_week)
            return {
                'id': obj.captain.id,
                'name': obj.captain.name,
                'position': obj.captain.position,
                'price': obj.captain.price,
                'team': obj.captain.team,
                'points': gw_points * 2,
                'goals': obj.captain.goals,
                'assists': obj.captain.assists,
                'clean_sheets': obj.captain.clean_sheets,
                'games_played': obj.captain.games_played,
                'yellow_cards': obj.captain.yellow_cards,
                'red_cards': obj.captain.red_cards,
                'MOTM': obj.captain.MOTM,
                'Pen_Saves': obj.captain.Pen_Saves,
                'game_stats': []
            }
        return None

    def get_game_week(self, obj):
        return {
            "id": obj.game_week.id,
            "week": obj.game_week.week,
            "start_date": obj.game_week.start_date,
            "end_date": obj.game_week.end_date,
        }

    def get_team(self, obj):
        return {
            'id': obj.team.id,
            'name': obj.team.name,
            'total_points': obj.team.total_points,
            'created_at': obj.team.created_at
        }

    def _calculate_player_game_week_points(self, player, game_week):
        """Calculate points for a player in a specific game week using prefetched data"""
        # This will use the prefetched game_stats data, no additional queries
        total_points = 0
        for stat in player.game_stats.all():
            if (stat.match and 
                stat.match.game_week and 
                stat.match.game_week.id == game_week.id):
                total_points += stat.points
        return total_points

    def update(self, instance, validated_data):
        # Use the new calculate_weekly_points method that accounts for captain double points
        instance.weekly_points = instance.calculate_weekly_points()
        instance.save()

        # Update total team points
        team = instance.team
        team.total_points = sum(snapshot.weekly_points for snapshot in team.snapshots.all())
        team.save()

        return instance


class FixtureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fixture
        fields = ['id', 'team1', 'team2', 'location', 'date', 'time']

class WomensFixtureSerializer(serializers.ModelSerializer):
    class Meta:
        model = WomensFixture
        fields = ['id', 'team1', 'team2', 'location', 'date', 'time']


class LeagueTableSerializer(serializers.ModelSerializer):
    total_points = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['id', 'name', 'total_points']

    def get_total_points(self, team):
        # Sum the weekly points from all snapshots related to this team
        return sum(snapshot.weekly_points for snapshot in team.snapshots.all())


class ResultsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Match
        fields = ['id', 'team1', 'team2', 'team1_score', 'team2_score', 'date']