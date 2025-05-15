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
        raw_lines = list(csv_data)

        # Skip the first row (which is empty or junk), then re-parse as CSV
        cleaned_csv = StringIO(''.join(raw_lines[1:]))

        reader = csv.DictReader(cleaned_csv)
        reader.fieldnames = [h.strip() for h in reader.fieldnames]  # Clean headers

        print("CSV headers:", reader.fieldnames)  # Optional debug

        today = datetime.now().date()

        for row in reader:
            try:
                row = {k.strip(): v.strip() for k, v in row.items()}

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
                self.stdout.write(self.style.ERROR(f"Skipping row due to error: {e}"))
