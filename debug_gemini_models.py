import os
import requests
import json

API_KEY = os.environ["GEMINI_API_KEY"]
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    with open("model_list.txt", "w") as f:
        # Check v1beta
        try:
            response = requests.get(url)
            if response.status_code == 200:
                models = response.json()
                f.write("v1beta Models:\n")
                for m in models.get('models', []):
                    if 'generateContent' in m.get('supportedGenerationMethods', []):
                        f.write(f"- {m['name']}\n")
            else:
                f.write(f"Error listing v1beta models: {response.status_code} - {response.text}\n")
        except Exception as e:
            f.write(f"Exception v1beta: {str(e)}\n")

        # Check v1
        f.write("\nv1 Models:\n")
        try:
            url_v1 = f"https://generativelanguage.googleapis.com/v1/models?key={API_KEY}"
            response_v1 = requests.get(url_v1)
            if response_v1.status_code == 200:
                 models = response_v1.json()
                 for m in models.get('models', []):
                     if 'generateContent' in m.get('supportedGenerationMethods', []):
                        f.write(f"- {m['name']}\n")
            else:
                f.write(f"Error listing v1 models: {response_v1.status_code} - {response_v1.text}\n")
        except Exception as e:
             f.write(f"Exception v1: {str(e)}\n")
    
    print("Models written to model_list.txt")

except Exception as e:
    print(f"Exception: {e}")
