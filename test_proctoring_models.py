
import cv2
import base64
import numpy as np
import time
from camera import get_frame

# Initialize Camera
cap = cv2.VideoCapture(0)

print("Starting Proctoring Model Test...")
print("Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to capture frame")
        break

    # Encode frame to base64 as expected by get_frame
    _, buffer = cv2.imencode('.jpg', frame)
    jpg_as_text = base64.b64encode(buffer)

    # Process Frame
    start_time = time.time()
    try:
        results = get_frame(jpg_as_text)
        
        # Decode returned image
        returned_jpg = base64.b64decode(results['jpg_as_text'])
        nparr = np.frombuffer(returned_jpg, np.uint8)
        output_frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Display Stats on Frame
        mob_status = "Mobile Detected" if results['mob_status'] == 1 else "No Mobile"
        person_status = ["Normal", "No Person", "Multiple Persons"][results['person_status']]
        
        head_ud = ["Center", "Up", "Down"][results['user_move1']]
        head_lr = ["Center", "", "", "Left", "Right"][results['user_move2']]
        
        eyes = ["Not Found", "Blink", "Center", "Left", "Right"][results['eye_movements']]

        cv2.putText(output_frame, f"Mobile: {mob_status}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(output_frame, f"Person: {person_status}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(output_frame, f"Head: {head_ud} / {head_lr}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv2.putText(output_frame, f"Eyes: {eyes}", (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)

        cv2.imshow('Proctoring Test', output_frame)
    
    except Exception as e:
        print(f"Error processing frame: {e}")
        cv2.imshow('Proctoring Test', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
