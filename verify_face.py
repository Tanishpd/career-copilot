import sys
import json
from deepface import DeepFace

def verify(img1_path, img2_path):
    try:
        # Use a lightweight model if possible, or default 'VGG-Face'
        # enforce_detection=False handles cases where face isn't perfectly clear
        result = DeepFace.verify(img1_path=img1_path, img2_path=img2_path, enforce_detection=False)
        print(json.dumps(result))
    except Exception as e:
        error_msg = {"verified": False, "error": str(e)}
        print(json.dumps(error_msg))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"verified": False, "error": "Insufficient arguments"}))
    else:
        verify(sys.argv[1], sys.argv[2])
