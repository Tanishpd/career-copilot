import cv2
import numpy as np
import dlib

def get_landmark_model(saved_model="gaze_tracking/trained_models/shape_predictor_68_face_landmarks.dat"):
    try:
        predictor = dlib.shape_predictor(saved_model)
        return predictor
    except Exception as e:
        print(f"Error loading dlib model: {e}")
        return None

def detect_marks(img, predictor, face_rect_coords):
    # face_rect_coords is [x, y, x1, y1] from the face detector
    # dlib expects a dlib.rectangle object
    left, top, right, bottom = [int(c) for c in face_rect_coords]
    dlib_rect = dlib.rectangle(left, top, right, bottom)
    
    shape = predictor(img, dlib_rect)
    
    marks = np.zeros((68, 2), dtype=int)
    for i in range(68):
        marks[i] = (shape.part(i).x, shape.part(i).y)
        
    return marks