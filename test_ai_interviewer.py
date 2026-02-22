from ai_interviewer import AIInterviewer
import os
from dotenv import load_dotenv

load_dotenv()

def test_ai():
    print("Initializing AIInterviewer...")
    ai = AIInterviewer()
    session_id = "test_session"
    
    print("Starting session...")
    msg = ai.start_session(session_id)
    print(f"AI: {msg}")
    
    user_input = "Yes, I am ready."
    print(f"User: {user_input}")
    
    print("Processing response...")
    try:
        reply, state = ai.process_response(session_id, user_input)
        print(f"AI: {reply}")
        print(f"State: {state}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ai()
