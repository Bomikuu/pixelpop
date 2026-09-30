import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from rest_framework.exceptions import ValidationError

from brainstorm.services.imports import MAX_BYTES, apply_import


class Command(BaseCommand):
    help = "Import boards, groups, and ideas from a JSON file without duplicating existing ideas."

    def add_arguments(self, parser):
        parser.add_argument("json_path", type=Path)

    def handle(self, *args, **options):
        path = options["json_path"]
        try:
            if path.stat().st_size > MAX_BYTES:
                raise CommandError("The JSON document must be smaller than 1 MiB.")
            with path.open(encoding="utf-8") as stream:
                payload = json.load(stream)
            summary = apply_import(payload, source="local_import")
        except (OSError, UnicodeError, json.JSONDecodeError, ValidationError) as error:
            raise CommandError(str(error)) from error
        self.stdout.write(json.dumps(summary, ensure_ascii=False))
