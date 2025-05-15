import csv
import requests
from datetime import datetime
from io import StringIO
from django.core.management.base import BaseCommand
from api.models import Fixture

CSV_URL = "https://docs.google.com/spreadsheets/d/1h92VSktiH3CoD_z4SSpyXWNtCfIXV9NTUcqO8vvFt2g/export?format=csv&gid=1256406894"

class Command(BaseCommand):
    help = 'Fetch fixtures from Google Sheets and save them to the database'

    def handle(self, *args, **kwargs):
        response = requests.get(CSV_URL)
        if response.status_code != 200:
            self.stdout.write(self.style.ERROR("Failed to fetch CSV from Google Sheets"))
            return

        csv_data = StringIO(response.text)
        reader = csv.DictReader(csv_data)

        # Normalize headers by stripping whitespace
        reader.fieldnames = [h.strip() for h in reader.fieldnames]

        # Optional: debug print to verify headers
        print("CSV headers:", reader.fieldnames)

        today = datetime.now().date()

        for row in reader:
            try:
                # Clean each row's keys in case they're also messy
                row = {k.strip(): v.strip() for k, v in row.items()}

                # Parse date and time
                fixture_date = datetime.strptime(row["Date"], "%d/%m/%Y").date()
                fixture_time = datetime.strptime(row["Time"], "%H:%M").time()
                location = row["Location"]

                # Parse teams
                team1 = row["A"]
                team2 = row["B"]

                # Filter out blank or incomplete rows
                if not team1 or not team2:
                    continue

                # Only keep Langwith fixtures (optional – remove this condition for all teams)
                if "Langwith" not in team1 and "Langwith" not in team2:
                    continue

                # Only add fixtures from today onwards
                if fixture_date < today:
                    continue

                # Save or update in database
                obj, created = Fixture.objects.update_or_create(
                    team1=team1,
                    team2=team2,
                    date=fixture_date,
                    defaults={
                        'time': fixture_time,
                        'location': location,
                    }
                )

                action = "Created" if created else "Updated"
                self.stdout.write(self.style.SUCCESS(f"{action} fixture: {team1} vs {team2} at {fixture_time} on {fixture_date}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Skipping row due to error: {e}"))
