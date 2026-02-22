import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

# Exact identifiers from audit JSON
candidates = [
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-pro-latest",
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash-001"
]

print("--- TESTING REFINED CANDIDATES ---")
for name in candidates:
    print(f"Trying: {name}...", end=" ", flush=True)
    try:
        model = genai.GenerativeModel(name)
        resp = model.generate_content("hi", generation_config={"max_output_tokens": 5})
        print(f"SUCCESS! -> {resp.text.strip()}")
    except Exception as e:
        print(f"FAILED -> {str(e)[:100]}")
