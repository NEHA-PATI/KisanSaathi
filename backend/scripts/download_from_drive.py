import os
from pathlib import Path
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive

# =====================================
# CONFIG
# =====================================

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = Path(__file__).resolve().parents[2]
SECRETS_DIR = BACKEND_ROOT / "secrets"
CLIENT_SECRETS_PATH = SECRETS_DIR / "client_secrets.json"
CREDENTIALS_PATH = SECRETS_DIR / "drive_credentials.json"

FOLDERS = {
    # "AgriAI_satellite_sambalpur": PROJECT_ROOT / "data" / "raw" / "satellite",
    # "AgriAI_weather": PROJECT_ROOT / "data" / "raw" / "weather",
    # "AgriAI_SMAP": PROJECT_ROOT / "data" / "raw" / "smap",
    "AgriAI_ET": PROJECT_ROOT / "data" / "raw" / "et",
    # "AgriAI_soil": PROJECT_ROOT / "data" / "raw" / "soil",
    # "AgriAI_crop": PROJECT_ROOT / "data" / "raw" / "crop",
}

# =====================================
# AUTH
# =====================================

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
drive = GoogleDrive(gauth)

# =====================================
# DOWNLOAD FUNCTION
# =====================================


def download_folder(folder_name, local_path):
    os.makedirs(local_path, exist_ok=True)

    query = f"title='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
    folder = drive.ListFile({"q": query}).GetList()[0]

    file_list = drive.ListFile({"q": f"'{folder['id']}' in parents"}).GetList()

    for file in file_list:
        file_path = os.path.join(local_path, file["title"])

        if os.path.exists(file_path):
            continue

        print(f"⬇️ {file['title']}")
        file.GetContentFile(str(file_path))


# =====================================
# RUN
# =====================================

for folder, path in FOLDERS.items():
    print(f"\n📂 Downloading {folder}")
    download_folder(folder, path)

print("\n✅ All data downloaded")
