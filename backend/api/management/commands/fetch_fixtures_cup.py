import csv
import requests
from datetime import datetime
from io import StringIO
from django.core.management.base import BaseCommand
from api.models import Fixture

CSV_URLS = [
    "https://docs.google.com/spreadsheets/d/1h92VSktiH3CoD_z4SSpyXWNtCfIXV9NTUcqO8vvFt2g/export?format=csv&gid=1256406894",  # Cup
    # "https://docs.google.com/spreadsheets/d/1h92VSktiH3CoD_z4SSpyXWNtCfIXV9NTUcqO8vvFt2g/export?format=csv&gid=307298730",   # Vase
]

class Command(BaseCommand):
    help = 'Fetch fixtures from multiple Google Sheets tabs and save them to the database'

    def handle(self, *args, **kwargs):
        today = datetime.now().date()

        for url in CSV_URLS:
            self.stdout.write(f"Fetching from: {url}")
            response = requests.get(url)

            if response.status_code != 200:
                self.stdout.write(self.style.ERROR(f"Failed to fetch CSV from {url}"))
                continue

            try:
                csv_data = StringIO(response.text)
                raw_lines = list(csv_data)

                # Skip the first row (junk header), reparse from second line
                cleaned_csv = StringIO(''.join(raw_lines[1:]))
                reader = csv.DictReader(cleaned_csv)

                # Normalize headers
                reader.fieldnames = [h.strip() for h in reader.fieldnames]
                self.stdout.write(f"Parsed headers: {reader.fieldnames}")

                for row in reader:
                    try:
                        row = {k.strip(): v.strip() for k, v in row.items()}

                        # Parse date and time
                        fixture_date = datetime.strptime(row["Date"], "%d/%m/%Y").date()
                        fixture_time = datetime.strptime(row["Time"], "%H:%M").time()
                        location = row["Location"]

                        team1 = row["A"]
                        team2 = row["B"]

                        if not team1 or not team2:
                            continue

                        if "Langwith" not in team1 and "Langwith" not in team2:
                            continue

                        if fixture_date < today:
                            continue

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
                        self.stdout.write(self.style.SUCCESS(
                            f"{action} fixture: {team1} vs {team2} at {fixture_time} on {fixture_date}"
                        ))

                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Row skipped due to error: {e}"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error processing CSV from {url}: {e}"))