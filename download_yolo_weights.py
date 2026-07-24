"""Fetch the YOLOv3 weights that camera.py's object detection needs.

The file is ~236 MB, so it is not committed. Without it the app still starts;
person/phone detection is simply disabled.

    python download_yolo_weights.py
"""
import os
import urllib.request

URL = "https://pjreddie.com/media/files/yolov3.weights"
DEST = os.path.join("models", "yolov3.weights")


def main():
    if os.path.exists(DEST):
        print(f"{DEST} already present ({os.path.getsize(DEST) / 1e6:.0f} MB)")
        return
    os.makedirs("models", exist_ok=True)
    print(f"Downloading {URL}\n  -> {DEST}  (~236 MB, this takes a while)")

    def progress(blocks, block_size, total):
        if total > 0:
            pct = min(100, blocks * block_size * 100 // total)
            print(f"\r  {pct}%", end="", flush=True)

    urllib.request.urlretrieve(URL, DEST, reporthook=progress)
    print(f"\nDone: {os.path.getsize(DEST) / 1e6:.0f} MB")


if __name__ == "__main__":
    main()
