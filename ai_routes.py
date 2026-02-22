
@app.route('/interview/start', methods=['POST'])
@user_role_student
def interview_start():
    test_id = request.json.get('test_id')
    session_id = f"{session['uid']}_{test_id}"
    
    # Initialize session in AIInterviewer
    # We might need to store this in database if we want persistence across server restarts
    # For now, in-memory is fine as per `ai_interviewer.py`
    
    initial_message = ai_interviewer.start_session(session_id)
    return jsonify({'message': initial_message, 'state': 'INTRODUCTION'})

@app.route('/interview/chat', methods=['POST'])
@user_role_student
def interview_chat():
    data = request.json
    test_id = data.get('test_id')
    user_input = data.get('user_input')
    session_id = f"{session['uid']}_{test_id}"
    
    # Fetch question context if needed (only for READ_QUESTION state)
    current_state = ai_interviewer.get_state(session_id)
    question_context = None
    
    if current_state == 'FOLLOW_UP': # Next is READ_QUESTION
        # Fetch the first question for this test
        cur = mysql.connection.cursor()
        cur.execute("SELECT q FROM practicalqa WHERE test_id = %s LIMIT 1", [test_id])
        result = cur.fetchone()
        cur.close()
        if result:
            question_context = result['q']
        else:
            question_context = "No question found."

    ai_response = ai_interviewer.process_response(session_id, user_input, question_context)
    new_state = ai_interviewer.get_state(session_id)
    
    return jsonify({'message': ai_response, 'state': new_state})
