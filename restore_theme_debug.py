
import os
import requests
import sys


# List of base URLs to try
BASE_URLS = [
    "https://cdn.jsdelivr.net/npm/@themesberg/volt-bootstrap-5-dashboard/dist",
    "https://cdn.jsdelivr.net/npm/volt-bootstrap-5-dashboard/dist",
    "https://raw.githubusercontent.com/themesberg/volt-bootstrap-5-dashboard/main/dist"
]

# Absolute path to project root (from where script is run)
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(PROJECT_ROOT, "static")

# Files to download and their target local paths
FILES = {
    "css/volt.css": os.path.join(STATIC_DIR, "volt", "css", "volt.css"),
    "js/volt.js": os.path.join(STATIC_DIR, "volt", "assets", "js", "volt.js")
}

def download_with_fallback(remote_path, target_path):
    for base in BASE_URLS:
        url = f"{base}/{remote_path}"
        print(f"Trying: {url}")
        try:
            response = requests.get(url, verify=False)
            if response.status_code == 200:
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                with open(target_path, 'wb') as f:
                    f.write(response.content)
                print(f"SUCCESS: Saved to {target_path}")
                return
            else:
                print(f"FAILED: {response.status_code}")
        except Exception as e:
            print(f"ERROR: {e}")
    print(f"CRITICAL: Could not download {remote_path} from any source.")

if __name__ == "__main__":
    print(f"Project Root: {PROJECT_ROOT}")
    if not os.path.exists(STATIC_DIR):
        print(f"ERROR: Static directory not found at {STATIC_DIR}")
        sys.exit(1)

    for remote_path, local_path in FILES.items():
        download_with_fallback(remote_path, local_path)
    print("Theme restoration script finished.")
