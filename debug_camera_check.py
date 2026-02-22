
import cv2
import numpy as np
import base64

# Create a small dummy image (red square)
img = np.zeros((100, 100, 3), dtype=np.uint8)
img[:] = (0, 0, 255) # Red
ret, jpeg = cv2.imencode('.jpg', img)
nparr = np.frombuffer(jpeg, np.uint8)

print(f"cv2.COLOR_BGR2GRAY value: {cv2.COLOR_BGR2GRAY}")
print(f"cv2.IMREAD_COLOR value: {cv2.IMREAD_COLOR}")

# Try decoding with the suspicious flag
try:
    decoded = cv2.imdecode(nparr, cv2.COLOR_BGR2GRAY)
    print(f"Decoded shape: {decoded.shape}")
    if len(decoded.shape) == 3:
        print("Decoded has 3 channels")
    else:
        print("Decoded is NOT 3 channels")
        
    # check if we can convert to RGB
    try:
        rgb = cv2.cvtColor(decoded, cv2.COLOR_BGR2RGB)
        print("cvtColor BGR2RGB success")
    except Exception as e:
        print(f"cvtColor BGR2RGB failed: {e}")

except Exception as e:
    print(f"imdecode failed: {e}")

# Check with proper flag
decoded_proper = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
print(f"Properly decoded shape: {decoded_proper.shape}")
