import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

candidates = ["gemini-pro-latest", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-pro-preview"]

print("--- TESTING MODELS ---")
with open("verified_models.txt", "w") as f:
    for name in candidates:
        try:
            model = genai.GenerativeModel(name)
            resp = model.generate_content("hi", generation_config={"max_output_tokens": 5})
            line = f"SUCCESS: {name}\n"
            print(line.strip())
            f.write(line)
        except Exception as e:
            line = f"FAILED: {name} - {str(e)[:50]}\n"
            print(line.strip())
f.close()
