
from deepface import DeepFace
import os

print("Starting model download check...")
# Force download by calling build_model
DeepFace.build_model('VGG-Face')
print("Model download complete or already verified.")
