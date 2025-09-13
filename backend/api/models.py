from django.utils import timezone  # Make sure this import is there
from django.db import models
from django.db.models import Sum
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, Group
from api.managers import CustomUserManager

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()

    groups = models.ManyToManyField(Group, related_name='customuser_set')
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        related_name='custom_user_permissions_set',
        related_query_name='user',
    )
    
    def __str__(self):
        return self.email


class Player(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    position = models.CharField(max_length=20, null=True, blank=True)
    team = models.CharField(max_length=255, null=True, blank=True)
    goals = models.IntegerField(default=0, null=True, blank=True)
    assists = models.IntegerField(default=0, null=True, blank=True)
    yellow_cards = models.IntegerField(default=0, null=True, blank=True)
    red_cards = models.IntegerField(default=0, null=True, blank=True)
    clean_sheets = models.IntegerField(default=0, null=True, blank=True)
    games_played = models.IntegerField(default=0, null=True, blank=True)
    price = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    points = models.IntegerField(default=0, null=True, blank=True)
    MOTM = models.IntegerField(default=0, null=True, blank=True)
    Pen_Saves = models.IntegerField(default=0, null=True, blank=True)

    # Displays name of player in admin panel

    def __str__(self):
        return f"{self.name or 'Unnamed Player'} – {self.points} points"


    def recalculate_totals(self):
        totals = self.game_stats.aggregate(
            goals=Sum('goals'),
            assists=Sum('assists'),
            yellow_cards=Sum('yellow_cards'),
            red_cards=Sum('red_cards'),
            clean_sheets=Sum('clean_sheets'),
            MOTM=Sum('MOTM'),
            Pen_Saves=Sum('Pen_Saves'),
            points=Sum('points'),
        )
        self.goals = totals['goals'] or 0
        self.assists = totals['assists'] or 0
        self.yellow_cards = totals['yellow_cards'] or 0
        self.red_cards = totals['red_cards'] or 0
        self.clean_sheets = totals['clean_sheets'] or 0
        self.MOTM = totals['MOTM'] or 0
        self.Pen_Saves = totals['Pen_Saves'] or 0
        self.points = totals['points'] or 0
        self.games_played = self.game_stats.count()
        self.save(update_fields=[
            'goals', 'assists', 'yellow_cards', 'red_cards',
            'clean_sheets', 'MOTM', 'Pen_Saves', 'points', 'games_played'
        ])
        

class Team(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    players = models.ManyToManyField(Player, related_name='team_players')
    captain = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='captain_teams')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='team_user')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    total_points = models.IntegerField(default=0, db_index=True)

    def __str__(self):
        return self.name
    
    def clean(self):
        """Validate that captain is one of the team's players"""
        from django.core.exceptions import ValidationError
        if self.captain and self.captain not in self.players.all():
            raise ValidationError({'captain': 'Captain must be one of the team\'s players.'})
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    

class GameWeek(models.Model):
    week = models.IntegerField(default = 0)
    start_date = models.DateField()
    end_date = models.DateField()

    @classmethod
    def get_current_game_week(cls):
        today = timezone.now().date()
        return cls.objects.filter(start_date__lte=today, end_date__gte=today).first()


    def __str__(self):
        return f"Game Week {self.start_date} - {self.end_date}"
    

class Match(models.Model):
    date = models.DateTimeField()
    team1 = models.CharField(max_length=255)
    team2 = models.CharField(max_length=255)
    team1_score = models.IntegerField(default=0)
    team2_score = models.IntegerField(default=0)
    game_week = models.ForeignKey(GameWeek, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        formatted_date = f"{self.date.day} {self.date.strftime('%B')}"
        return f"{self.team1} vs {self.team2} on {formatted_date}"


class PlayerGameStatsManager(models.Manager):
    def update(self, **kwargs):
        """Override update to trigger recalculation"""
        result = super().update(**kwargs)
        # After bulk update, recalculate all affected players
        from django.db import transaction
        transaction.on_commit(self._recalculate_affected_players)
        return result
    
    def _recalculate_affected_players(self):
        """Recalculate totals for all players with game stats"""
        players = Player.objects.filter(game_stats__isnull=False).distinct()
        for player in players:
            player.recalculate_totals()


class PlayerGameStats(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='game_stats')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='game_stats')
    goals = models.IntegerField(default=0)
    assists = models.IntegerField(default=0)
    yellow_cards = models.IntegerField(default=0)
    red_cards = models.IntegerField(default=0)
    clean_sheets = models.IntegerField(default=0)
    MOTM = models.IntegerField(default=0)
    Pen_Saves = models.IntegerField(default=0)
    points = models.IntegerField(default=0)
    
    objects = PlayerGameStatsManager()

    def __str__(self):
        return f"{self.player.name} - {self.match}"

    def calculate_points(self):
        """Compute points based on player position and match stats."""
        points = 2  # Base points for all players
        position = getattr(self.player, "position", None)
        if position == "Attacker":
            points += self.goals * 4 + self.assists * 3
        elif position == "Midfielder":
            points += self.goals * 5 + self.assists * 3 + self.clean_sheets * 1
        elif position == "Defender":
            points += self.goals * 6 + self.assists * 4 + self.clean_sheets * 4
        elif position == "Goalkeeper":
            points += self.goals * 8 + self.assists * 5 + self.clean_sheets * 5
        points -= self.yellow_cards * 1 + self.red_cards * 3
        points += self.MOTM * 2 + self.Pen_Saves * 5
        return points

    def save(self, *args, **kwargs):
        old_player = None
        if self.pk:
            old_player = PlayerGameStats.objects.get(pk=self.pk).player

        self.points = self.calculate_points()
        super().save(*args, **kwargs)

        if old_player and old_player != self.player:
            old_player.recalculate_totals()
        self.player.recalculate_totals()

    def delete(self, *args, **kwargs):
        player = self.player
        super().delete(*args, **kwargs)
        player.recalculate_totals()


class TeamSnapshot(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='snapshots')
    players = models.ManyToManyField(Player, related_name='snapshot_players')
    captain = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='captain_snapshots')
    game_week = models.ForeignKey(GameWeek, on_delete=models.CASCADE, related_name='team_snapshots')
    snapshot_date = models.DateField(auto_now_add=True)
    weekly_points = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['game_week', 'weekly_points']),
        ]

    def __str__(self):
        return f"{self.team.name} - {self.game_week.start_date} to {self.game_week.end_date}"
    
    def clean(self):
        """Validate that captain is one of the snapshot's players"""
        from django.core.exceptions import ValidationError
        # Only validate if the object has been saved (has an ID) and has a captain
        if self.pk and self.captain and self.captain not in self.players.all():
            raise ValidationError({'captain': 'Captain must be one of the snapshot\'s players.'})
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def calculate_weekly_points(self):
        """Calculate weekly points for this snapshot, doubling captain's points"""
        total_points = 0
        
        # Get all player game stats for this game week
        player_stats = PlayerGameStats.objects.filter(
            player__in=self.players.all(),
            match__game_week=self.game_week
        )
        
        for stat in player_stats:
            points = stat.points
            # Double points if this player is the captain
            if self.captain and stat.player == self.captain:
                points *= 2
            total_points += points
            
        return total_points


class Fixture(models.Model):
    team1 = models.CharField(max_length=100)
    team2 = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    date = models.DateField()
    time = models.TimeField()

    class Meta:
        ordering = ['date', 'time']
        unique_together = ('team1', 'team2')

    def __str__(self):
        formatted_date = f"{self.date.day} {self.date.strftime('%B')}"
        return f"{self.team1} vs {self.team2} on {formatted_date}"

class WomensFixture(models.Model):
    team1 = models.CharField(max_length=100)
    team2 = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    date = models.DateField()
    time = models.TimeField()

    class Meta:
        unique_together = ('team1', 'team2')
    
    def __str__(self):
        return f"{self.team1} vs {self.team2} on {self.date} at {self.location}"
