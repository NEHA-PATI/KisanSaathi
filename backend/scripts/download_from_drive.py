import argparse
import os
import sys
from pathlib import Path

from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from ingestion.config import SOURCES, get_district_config, ensure_district_dirs


SECRETS_DIR = BACKEND_ROOT / "secrets"
CLIENT_SECRETS_PATH = SECRETS_DIR / "client_secrets.json"
CREDENTIALS_PATH = SECRETS_DIR / "drive_credentials.json"


def authenticate_drive():
    gauth = GoogleAuth(
        settings={
            "client_config_backend": "file",
            "client_config_file": str(CLIENT_SECRETS_PATH),
            "save_credentials": True,
            "save_credentials_backend": "file",
            "save_credentials_file": str(CREDENTIALS_PATH),
            "oauth_scope": ["https://www.googleapis.com/auth/drive.readonly"],
        }
    )
    gauth.LocalWebserverAuth()
    return GoogleDrive(gauth)


def download_folder(drive, folder_name, local_path):
    os.makedirs(local_path, exist_ok=True)

    query = (
        f"title='{folder_name}' "
        "and mimeType='application/vnd.google-apps.folder' "
        "and trashed=false"
    )
    folders = drive.ListFile({"q": query}).GetList()
    if not folders:
        print(f"Drive folder not found, skipping: {folder_name}")
        return

    folder = folders[0]
    file_list = drive.ListFile(
        {"q": f"'{folder['id']}' in parents and trashed=false"}
    ).GetList()

    for file in file_list:
        file_path = Path(local_path) / file["title"]
        if file_path.exists():
            continue

        print(f"Downloading {file['title']} -> {file_path}")
        file.GetContentFile(str(file_path))


def main():
    parser = argparse.ArgumentParser(description="Download district exports from Google Drive.")
    parser.add_argument("--district", help="District key from district_config.json")
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=SOURCES,
        default=list(SOURCES),
        help="Sources to download.",
    )
    args = parser.parse_args()

    config = get_district_config(args.district)
    ensure_district_dirs(config)
    drive = authenticate_drive()

    for source in args.sources:
        folder = config.drive_folder(source)
        path = config.raw_source_dir(source)
        print(f"\nDownloading {source}: {folder}")
        download_folder(drive, folder, path)

    print("\nAll requested data downloaded.")


if __name__ == "__main__":
    main()
