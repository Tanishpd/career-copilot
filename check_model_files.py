import os

files = [
    "models/pose_model/variables/variables.data-00000-of-00001",
    "models/pose_model/variables/variables.index"
]

for f in files:
    if os.path.exists(f):
        print(f"{f}: {os.path.getsize(f)} bytes")
    else:
        print(f"{f} not found")
