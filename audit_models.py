import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

model_data = []
try:
    for m in genai.list_models():
        model_data.append({
            "name": m.name,
            "display_name": m.display_name,
            "description": m.description,
            "supported_generation_methods": m.supported_generation_methods
        })
    with open("full_model_audit.json", "w") as f:
        json.dump(model_data, f, indent=2)
    print(f"Audit saved with {len(model_data)} models.")
except Exception as e:
    print(f"Error: {e}")
