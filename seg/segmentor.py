import cv2
import numpy as np
from .model_loader import load_model

model = load_model()

def segment(frame):
    results = model.predict(frame)
    mask = results[0].mask.data  # np.array маска
    return mask
