
import os
import requests

# Base URL for Volt theme files
BASE_URL = "https://raw.githubusercontent.com/themesberg/volt-bootstrap-5-dashboard/master/dist"

# Files to download and their target local paths
FILES = {
    "css/volt.css": "static/volt/css/volt.css",
    "js/volt.js": "static/volt/assets/js/volt.js"
}

def download_file(url, target_path):
    print(f"Downloading {url}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        with open(target_path, 'wb') as f:
            f.write(response.content)
        print(f"Saved to {target_path}")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    print("Starting theme restoration...")
    for remote_path, local_path in FILES.items():
        url = f"{BASE_URL}/{remote_path}"
        download_file(url, local_path)
    print("Theme restoration complete.")
