"""Native, read-only snapshots of the configured database (not uploaded files)."""
from contextlib import closing
import os
import shutil
import sqlite3
import subprocess
import tempfile

from django.db import connection, DatabaseError
from django.http import FileResponse
from django.utils import timezone
from rest_framework.exceptions import APIException


class BackupUnavailable(APIException):
    status_code = 503
    default_detail = "The database backup could not be created. Please try again."


def database_backup():
    vendor = connection.vendor
    if vendor not in {"sqlite", "postgresql"}:
        raise BackupUnavailable("Database backups support SQLite and PostgreSQL only.")
    extension = "sqlite3" if vendor == "sqlite" else "dump"
    backup = tempfile.NamedTemporaryFile(suffix="." + extension)
    try:
        if vendor == "sqlite":
            connection.ensure_connection()
            with closing(sqlite3.connect(backup.name)) as destination:
                # The SQLite backup API includes every table and handles WAL safely.
                connection.connection.backup(destination, pages=256)
        else:
            executable = shutil.which("pg_dump")
            if not executable:
                raise BackupUnavailable("Install the PostgreSQL pg_dump client on the backend server to enable full backups.")
            settings = connection.settings_dict
            env = os.environ.copy()
            for key, setting in (("PGDATABASE", "NAME"), ("PGUSER", "USER"),
                                 ("PGPASSWORD", "PASSWORD"), ("PGHOST", "HOST"), ("PGPORT", "PORT")):
                env[key] = str(settings.get(setting) or "")
            for option, key in (("sslmode", "PGSSLMODE"), ("sslrootcert", "PGSSLROOTCERT"),
                                ("sslcert", "PGSSLCERT"), ("sslkey", "PGSSLKEY")):
                value = settings.get("OPTIONS", {}).get(option)
                if value:
                    env[key] = str(value)
            result = subprocess.run(
                [executable, "--format=custom", "--no-password"], env=env,
                stdout=backup, stderr=subprocess.DEVNULL, timeout=120, check=False,
            )
            if result.returncode:
                raise BackupUnavailable()
        backup.seek(0)
        stamp = timezone.now().strftime("%Y%m%d-%H%M%S")
        response = FileResponse(backup, as_attachment=True, filename=f"pixelpop-full-database-{stamp}.{extension}", content_type="application/octet-stream")
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Robots-Tag"] = "noindex, nofollow"
        return response  # FileResponse closes (and deletes) the temporary file.
    except BackupUnavailable:
        backup.close()
        raise
    except (sqlite3.Error, DatabaseError, OSError, subprocess.SubprocessError):
        backup.close()
        raise BackupUnavailable() from None
    except Exception:
        backup.close()
        raise
