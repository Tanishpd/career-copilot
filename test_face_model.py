
import cv2
import numpy as np
from face_detector import get_face_detector, find_faces

def test_model():
    print("Loading face detector (quantized=True)...")
    try:
        model = get_face_detector(quantized=True)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Failed to load model: {e}")
        return

    print("Loading sample image...")
    img = cv2.imread("sample_face.jpg")
    if img is None:
        print("Failed to load sample_face.jpg")
        return
    
    print(f"Image shape: {img.shape}")
    
    print("Detecting faces...")
    try:
        faces = find_faces(img, model)
        print(f"Faces detected: {len(faces)}")
        for i, face in enumerate(faces):
            print(f"Face {i}: {face}")
    except Exception as e:
        print(f"Error during detection: {e}")

if __name__ == "__main__":
    test_model()
