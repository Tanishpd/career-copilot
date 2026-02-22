import os
import urllib.request
import ssl

# Ignore SSL certificate errors
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base_url = "https://raw.githubusercontent.com/narender-rk10/MyProctor.ai-AI-BASED-SMART-ONLINE-EXAMINATION-PROCTORING-SYSYTEM/master/models/pose_model/variables/"
files = ["variables.data-00000-of-00001", "variables.index"]
target_dir = "models/pose_model/variables"

if not os.path.exists(target_dir):
    os.makedirs(target_dir)

for file in files:
    url = base_url + file
    target_path = os.path.join(target_dir, file)
    print(f"Downloading {file} from {url}...")
    try:
        with urllib.request.urlopen(url, context=ctx) as response, open(target_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        print(f"Downloaded {file}")
    except Exception as e:
        print(f"Failed to download {file}: {e}")
