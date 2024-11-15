# fetch_fixtures.py
import requests
from datetime import datetime
from django.core.management.base import BaseCommand
from api.models import Fixture

class Command(BaseCommand):
    help = 'Fetch fixtures from external API and save them to the database'

    def handle(self, *args, **kwargs):
        # List of URLs to fetch fixtures from
        urls = [
            'https://sports-admin.yorksu.org/api/clst1o9lv0001q5teb61pqfyy/leagues/cm1gjcjrf00x5dzdhm9ho5ud3/fixtures',
            'https://sports-admin.yorksu.org/api/clst1o9lv0001q5teb61pqfyy/leagues/cm16gqclc007j4z8m7fm670g8/fixtures',
            'https://sports-admin.yorksu.org/api/clst1o9lv0001q5teb61pqfyy/leagues/cm16gqqrq007m4z8m25bonu9i/fixtures',
            'https://sports-admin.yorksu.org/api/clst1o9lv0001q5teb61pqfyy/leagues/cm16gr447007p4z8mkvmsx9nn/fixtures',
            'https://sports-admin.yorksu.org/api/clst1o9lv0001q5teb61pqfyy/leagues/cm16grdy2007s4z8mdkuqk8y2/fixtures',
            'https://sports-admin.yorksu.org/api/clst1o9lv0001q5teb61pqfyy/leagues/cm16grveq007v4z8mnj6xfdzd/fixtures'
        ]

        # Get today's date
        today = datetime.now().date()

        # Loop through each URL
        for url in urls:
            # Send a GET request to the API
            response = requests.get(url)
            if response.status_code == 200:
                # Parse the JSON content
                data = response.json()  # Assuming the API returns JSON data
                
                # Loop through the fixtures
                for fixture in data:
                    # Extract start time and location
                    starts_at = fixture['startsAt']
                    location = fixture['location']['name']
                    
                    # Extract teams
                    teams = fixture['teams']
                    team1 = teams[0]['team']['name']  # Team A
                    team2 = teams[1]['team']['name']  # Team B
                    
                    # Convert starts_at to a datetime object for easier manipulation
                    start_time = datetime.fromisoformat(starts_at[:-1])  # Remove the 'Z' at the end
                    fixture_date = start_time.date()  # Extract the date from start_time
                    
                    # Check if the fixture date is today or in the past and if it involves "Langwith"
                    if fixture_date >= today and ('Langwith' in team1 or 'Langwith' in team2):
                        # Extract time
                        time = start_time.time()
                        
                        # Save to database
                        obj, created = Fixture.objects.update_or_create(
                            team1=team1,
                            team2=team2,
                            defaults={
                                'location': location,
                                'date': fixture_date,
                                'time': time,
                            }
                        )
                        if created:
                            self.stdout.write(self.style.SUCCESS(
                                f"Created new Fixture: {team1} vs {team2} on {fixture_date} at {location}"
                            ))
                        else:
                            self.stdout.write(self.style.SUCCESS(
                                f"Updated Fixture: {team1} vs {team2} on {fixture_date} at {location}"
                            ))
            else:
                self.stdout.write(self.style.ERROR(
                    f"Failed to retrieve data from {url}"
                ))
