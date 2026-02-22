import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

print("--- FULL MODEL LIST ---")
try:
    models = genai.list_models()
    for m in models:
        print(f"Name: {m.name}")
        print(f"Methods: {m.supported_generation_methods}")
        print("---")
except Exception as e:
    print(f"Error: {e}")
