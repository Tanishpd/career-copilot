import google.generativeai as genai
import os
import time
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

# These are combinations of what we've seen and standard ones
candidates = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
    "gemini-pro-latest",
    "gemini-1.5-pro",
    "gemini-1.0-pro"
]

print("--- STARTING BATTLETEST ---")
working_model = None

# First list all available models for generateContent again to be 100% sure of strings
print("Actually available models in SDK:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")
            if m.name.removeprefix("models/") not in candidates:
                candidates.append(m.name.removeprefix("models/"))
except Exception as e:
    print(f"Error listing: {e}")

print("\nTesting candidates for actual content generation:")
for name in candidates:
    print(f"Trying: {name}...", end=" ", flush=True)
    try:
        model = genai.GenerativeModel(name)
        # Smallest possible prompt to save quota
        resp = model.generate_content("hi", generation_config={"max_output_tokens": 5})
        print(f"SUCCESS! -> {resp.text.strip()}")
        working_model = name
        break 
    except Exception as e:
        err = str(e)
        if "404" in err:
            print("FAILED (404 - Not Found)")
        elif "429" in err:
            print("FAILED (429 - Quota Exceeded)")
        else:
            print(f"FAILED ({err})")

if working_model:
    print(f"\nFINAL VERIFIED MODEL: {working_model}")
else:
    print("\nCRITICAL: No working model found. Checking project status...")
