import csv
import os

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import Player


class Command(BaseCommand):
    help = "Update player prices from a CSV file with columns: name, <ignore>, <ignore>, price"

    def add_arguments(self, parser):
        parser.add_argument(
            "--csv",
            dest="csv_path",
            help="Path to CSV file. Defaults to backend/data/player_prices.csv",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and report changes without writing to the database.",
        )

    def handle(self, *args, **options):
        default_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "data",
            "player_prices.csv",
        )
        csv_path = options.get("csv_path") or default_path

        if not os.path.exists(csv_path):
            raise CommandError(f"CSV not found: {csv_path}")

        updated = 0
        missing = []
        errors = []

        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row_num, row in enumerate(reader, start=1):
                if not row:
                    continue
                # Expecting 4+ columns; name in col 0, price in col 3
                try:
                    name = (row[0] or "").strip()
                    price_str = (row[3] or "").strip()
                except IndexError:
                    errors.append(f"Row {row_num}: not enough columns (need at least 4)")
                    continue

                if not name:
                    errors.append(f"Row {row_num}: empty name")
                    continue

                if not price_str:
                    errors.append(f"Row {row_num}: empty price for {name}")
                    continue

                # Allow numbers like 6, 6.0, 6.5, possibly with currency symbol
                price_str = price_str.replace("$", "").replace("£", "").replace(",", "")
                try:
                    price = float(price_str)
                except ValueError:
                    errors.append(f"Row {row_num}: invalid price '{price_str}' for {name}")
                    continue

                player = Player.objects.filter(name__iexact=name).first()
                if not player:
                    missing.append(name)
                    continue

                if options.get("dry_run"):
                    updated += 1
                    self.stdout.write(f"Would update {player.name}: {player.price} -> {price}")
                else:
                    player.price = price
                    player.save(update_fields=["price"])
                    updated += 1

        if not options.get("dry_run"):
            # Ensure atomic summary or wrap in transaction for bulk processing if needed
            pass

        # Summary
        self.stdout.write(self.style.SUCCESS(f"Updated prices for {updated} players"))
        if missing:
            self.stdout.write(self.style.WARNING(f"No matching Player for {len(missing)} rows"))
            for name in sorted(set(missing)):
                self.stdout.write(f"  - {name}")
        if errors:
            self.stdout.write(self.style.ERROR(f"Encountered {len(errors)} row errors"))
            for msg in errors:
                self.stdout.write(f"  - {msg}")


