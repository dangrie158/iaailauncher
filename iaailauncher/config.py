import os
from os import environ
from pathlib import Path

LAUNCHERS_BASE = Path("/opt/images/launchers")
LAUNCHERS_INFO_FILE = LAUNCHERS_BASE / "launchers.json"
LAUNCHERS_RUN_DIR = Path(environ.get("HOME")) / ".local/run/iaailauncher/"
LAUNCHERS_VAR_DIR = Path(environ.get("HOME")) / ".local/var/iaailauncher/"
SBATCH_PATH = Path("/usr/bin/sbatch")

LAUNCHERS_RUN_DIR.mkdir(parents=True, exist_ok=True)
LAUNCHERS_VAR_DIR.mkdir(parents=True, exist_ok=True)

WORKING_DIRECTORY = Path(os.getcwd())
