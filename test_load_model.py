import tensorflow as tf
from tensorflow import keras
import os

model_path = "models/pose_model"
print(f"Loading model from {model_path}...")
try:
    model = keras.models.load_model(model_path)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    import traceback
    traceback.print_exc()
