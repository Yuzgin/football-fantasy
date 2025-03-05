from django.utils import timezone  # Make sure this import is there
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, Group
from api.managers import CustomUserManager

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)

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


class Team(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    players = models.ManyToManyField(Player, related_name='team_players')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='team_user')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    total_points = models.IntegerField(default=0)

    def __str__(self):
        return self.name
    

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
    game_week = models.ForeignKey(GameWeek, on_delete=models.SET_NULL, null=True, blank=True)


class PlayerGameStats(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='game_stats')
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='game_stats')
    goals = models.IntegerField(default=0)
    assists = models.IntegerField(default=0)
    yellow_cards = models.IntegerField(default=0)
    red_cards = models.IntegerField(default=0)
    clean_sheets = models.IntegerField(default=0)
    points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.player.name} - {self.match}"


class TeamSnapshot(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='snapshots')
    players = models.ManyToManyField(Player, related_name='snapshot_players')
    game_week = models.ForeignKey(GameWeek, on_delete=models.CASCADE, related_name='team_snapshots')
    snapshot_date = models.DateField(auto_now_add=True)
    weekly_points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.team.name} - {self.game_week.start_date} to {self.game_week.end_date}"


class Fixture(models.Model):
    team1 = models.CharField(max_length=100)
    team2 = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    date = models.DateField()
    time = models.TimeField()

    class Meta:
        unique_together = ('team1', 'team2')

    def __str__(self):
        return f"{self.team1} vs {self.team2} on {self.date} at {self.location}"

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