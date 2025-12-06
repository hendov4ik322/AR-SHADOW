from ultralytics import YOLO
def load_model():
    return YOLO("yolov8n-seg.pt")
