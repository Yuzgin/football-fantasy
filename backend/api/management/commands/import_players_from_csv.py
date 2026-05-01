import csv
import os
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import Player


POSITION_MAP = {
    "GK": "Goalkeeper",
    "DEF": "Defender",
    "MID": "Midfielder",
    "FWD": "Attacker",
    "GOALKEEPER": "Goalkeeper",
    "DEFENDER": "Defender",
    "MIDFIELDER": "Midfielder",
    "ATTACKER": "Attacker",
}


class Command(BaseCommand):
    help = (
        "Import players from a CSV file with columns: name, full_name, position, team, price. "
        "Ignores any stats columns and sets all player stats to 0."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--csv",
            dest="csv_path",
            help="Path to CSV file. Defaults to backend/api/data/Langwith2026CupPlayers.csv",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and report changes without writing to the database.",
        )

    def handle(self, *args, **options):
        default_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),  # backend/api
            "data",
            "Langwith2026CupPlayers.csv",
        )
        csv_path = options.get("csv_path") or default_path

        if not os.path.exists(csv_path):
            raise CommandError(f"CSV not found: {csv_path}")

        created = 0
        updated = 0
        errors = []

        def normalize_position(value: str) -> str:
            raw = (value or "").strip()
            key = raw.upper()
            return POSITION_MAP.get(key, raw)

        def parse_price(value: str) -> Decimal:
            raw = (value or "").strip()
            raw = raw.replace("£", "").replace("$", "").replace(",", "")
            if raw == "":
                raise InvalidOperation("empty price")
            return Decimal(raw)

        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            required = {"name", "full_name", "position", "team", "price"}
            if not reader.fieldnames:
                raise CommandError("CSV has no header row")
            missing_cols = sorted(required - set(reader.fieldnames))
            if missing_cols:
                raise CommandError(f"CSV missing required columns: {', '.join(missing_cols)}")

            @transaction.atomic
            def run_import():
                nonlocal created, updated
                for row_num, row in enumerate(reader, start=2):  # header is row 1
                    try:
                        name = (row.get("name") or "").strip()
                        full_name = (row.get("full_name") or "").strip()
                        position = normalize_position(row.get("position") or "")
                        team = (row.get("team") or "").strip()
                        price = parse_price(row.get("price") or "")

                        if not full_name:
                            raise ValueError("empty full_name")
                        if not team:
                            raise ValueError("empty team")
                        if not position:
                            raise ValueError("empty position")

                        lookup = {
                            "full_name__iexact": full_name,
                            "team__iexact": team,
                        }
                        player = Player.objects.filter(**lookup).first()

                        new_values = {
                            "name": name or full_name,
                            "full_name": full_name,
                            "position": position,
                            "team": team,
                            "price": price,
                            # New season: ignore any CSV stats, set everything to 0
                            "goals": 0,
                            "assists": 0,
                            "yellow_cards": 0,
                            "red_cards": 0,
                            "clean_sheets": 0,
                            "games_played": 0,
                            "points": 0,
                            "MOTM": 0,
                            "Pen_Saves": 0,
                        }

                        if options.get("dry_run"):
                            action = "CREATE" if player is None else "UPDATE"
                            self.stdout.write(f"[DRY RUN] {action}: {full_name} ({team}) {position} £{price}")
                            if player is None:
                                created += 1
                            else:
                                updated += 1
                            continue

                        if player is None:
                            Player.objects.create(**new_values)
                            created += 1
                        else:
                            for k, v in new_values.items():
                                setattr(player, k, v)
                            player.save()
                            updated += 1

                    except (InvalidOperation, ValueError) as e:
                        errors.append(f"Row {row_num}: {e}")

            run_import()

        self.stdout.write(self.style.SUCCESS(f"Players created: {created}, updated: {updated}"))
        if errors:
            self.stdout.write(self.style.ERROR(f"Encountered {len(errors)} row errors"))
            for msg in errors:
                self.stdout.write(f"  - {msg}")

