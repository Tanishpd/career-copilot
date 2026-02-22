import google.generativeai as genai
import json
import logging
import time
import random
import os
from dotenv import load_dotenv

load_dotenv()

class AIInterviewer:
    def __init__(self, api_key=None):
        # Use provided key or fetch from environment (v15)
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        # Configure the SDK
        genai.configure(api_key=self.api_key)
        # We handle model selection per-request for high-resilience
        self.sessions = {}  # Store session state

    def start_session(self, session_id):
        self.sessions[session_id] = {
            'state': 'WAITING_FOR_READY',
            'history': []
        }
        return "Hello! I am your AI Interviewer. Are you ready for the interview?"

    def get_state(self, session_id):
        if session_id in self.sessions:
            return self.sessions[session_id]['state']
        return 'WAITING_FOR_READY'

    def process_response(self, session_id, user_input, question_context=None, candidate_code=None):
        if session_id not in self.sessions:
            self.start_session(session_id)

        session = self.sessions[session_id]
        state = session['state']
        history = session['history']

        ai_response = ""
        next_state = state

        # Construct Prompt based on State
        system_instruction = ""
        
        if state == 'WAITING_FOR_READY':
             system_instruction = (
                f"Candidate Input: '{user_input}'\n"
                "Task: check if the candidate is ready. If yes, ask for introduction. Max 30 words."
             )
             next_state = 'INTRODUCTION' 
        elif state == 'INTRODUCTION':
            system_instruction = (
                f"Candidate Input: '{user_input}'\n"
                "Task: Technical interviewer. Acknowledge introduction. Ask ONE technical question. Max 50 words."
            )
            next_state = 'TECH_FOLLOWUP'
        elif state == 'TECH_FOLLOWUP':
            system_instruction = (
                f"Candidate Answer: '{user_input}'\n"
                "Task: Validate answer. Transition to problem: {question_context}. Ask them to write code in the editor."
            )
            next_state = 'WAITING_FOR_CODE'
        elif state == 'WAITING_FOR_CODE':
            if candidate_code:
                 state = 'CODE_ANALYSIS' 
            else:
                 return "Please write your code in the editor and click Submit.", "WAITING_FOR_CODE"

        if state == 'CODE_ANALYSIS': 
             system_instruction = (
                f"Candidate Code:\n{candidate_code}\n"
                "Task: Analyze correctness. Ask for approach and data structures used."
             )
             next_state = 'APPROACH'
        elif state == 'APPROACH':
            system_instruction = (
                f"Candidate Explanation: '{user_input}'\n"
                "Task: Ask for Time and Space complexities."
            )
            next_state = 'COMPLEXITY'
        elif state == 'COMPLEXITY':
             system_instruction = (
                f"Candidate Answer: '{user_input}'\n"
                "Task: Validate complexity. Ask for potential optimizations."
            )
             next_state = 'OPTIMIZATION'
        elif state == 'OPTIMIZATION':
            system_instruction = (
                f"Candidate Reasoning: '{user_input}'\n"
                "Task: Final wrap-up. Interview completed."
            )
            next_state = 'COMPLETED'
        elif state == 'COMPLETED':
            return "Interview completed. Good luck!", "COMPLETED"
            
        real_user_input = user_input
        if state == 'CODE_ANALYSIS' and candidate_code:
            real_user_input = f"[Submitted Code]: \n{candidate_code}"

        # PRODUCTION (v15): High-resilience stack for Interviewer
        models_to_try = [
            "gemini-2.5-flash-lite", 
            "gemini-2.0-flash-lite", 
            "gemini-2.0-flash", 
            "gemini-1.5-flash",
            "gemini-pro-latest", 
            "gemma-3-4b-it"
        ]
        last_error = ""

        for model_name in models_to_try:
            try:
                print(f"DEBUG: v15 SDK Interviewer calling {model_name}...", flush=True)
                model = genai.GenerativeModel(model_name)
                
                # Prepare contents
                contents = []
                for h in history:
                    contents.append({"role": h['role'], "parts": [{"text": h['parts'][0]}]})
                contents.append({"role": "user", "parts": [{"text": system_instruction}]})

                response = model.generate_content(contents)
                ai_response = response.text

                # Success: update history and state
                session['history'].append({'role': 'user', 'parts': [real_user_input]})
                session['history'].append({'role': 'model', 'parts': [ai_response]})
                session['state'] = next_state
                return ai_response, next_state

            except Exception as e:
                last_error = str(e)
                print(f"DEBUG: v15 Interviewer {model_name} failed: {last_error}")
                if "429" in last_error:
                    time.sleep(2) # Brief wait before trying next model
                continue

        return "⚠️ AI Service Limited. Please wait or refresh the interview.", state
