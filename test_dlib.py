import dlib
import cv2
import numpy as np
import os

predictor_path = "gaze_tracking/trained_models/shape_predictor_68_face_landmarks.dat"

if not os.path.exists(predictor_path):
    print(f"Predictor not found at {predictor_path}")
else:
    try:
        detector = dlib.get_frontal_face_detector()
        predictor = dlib.shape_predictor(predictor_path)
        print("Dlib predictor loaded successfully!")
    except Exception as e:
        print(f"Error loading dlib: {e}")
