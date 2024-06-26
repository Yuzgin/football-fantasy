from datetime import datetime
from django.db import models
from django.contrib.auth.models import AbstractUser, Group
from api.managers import CustomUserManager

# Create your models here.

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()
    groups = models.ManyToManyField(Group, related_name='customuser_set')
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        related_name='custom_user_permissions_set',  # Unique related_name
        related_query_name='user',
    )


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
    price = models.IntegerField(null=True, blank=True)


class Team(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    players = models.ManyToManyField(Player, related_name='team_players')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='team_user')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    total_points = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class Match(models.Model):
    date = models.DateTimeField()
    team1 = models.CharField(max_length=255)
    team2 = models.CharField(max_length=255)
    

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
