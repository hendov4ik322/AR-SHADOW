хуй
from flask import Flask, request, send_from_directory, jsonify, send_file
from ultralytics import YOLO
import numpy as np
import cv2
import io
from PIL import Image
import os
import traceback
import logging

# CONFIG
MODEL_NAME = os.environ.get('MODEL_NAME', 'yolov8n-seg.pt')
MODEL_PATH = os.path.join('models', MODEL_NAME) if os.path.exists(os.path.join('models', MODEL_NAME)) else MODEL_NAME

app = Flask(__name__, static_folder='static', static_url_path='/static')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# load model (Ultralytics will download if not present)
print('Loading model:', MODEL_PATH)
model = YOLO(MODEL_PATH)
print('Model loaded')


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/seg', methods=['POST'])
def seg():
    try:
        # expect JPEG/PNG in body as form-data file 'frame'
        if 'frame' not in request.files:
            return jsonify({'error':'no frame'}), 400

        file = request.files['frame']
        if file.filename == '':
            return jsonify({'error':'empty filename'}), 400
        
        img_bytes = file.read()
        if not img_bytes:
            return jsonify({'error':'empty file'}), 400
        
        pil = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        frame = np.array(pil)[:, :, ::-1]  # RGB->BGR

        # run model
        res = model(frame, imgsz=640, conf=0.25, verbose=False)[0]

        # if masks exist, combine them
        if res.masks is None or len(res.masks.data) == 0:
            h, w = frame.shape[:2]
            blank = np.zeros((h, w), dtype=np.uint8)
            img_pil = Image.fromarray(blank)
            buf = io.BytesIO()
            img_pil.save(buf, format='PNG')
            buf.seek(0)
            return send_file(buf, mimetype='image/png')

        # combine masks (binary OR)
        masks = res.masks.data  # shape: (N, H, W)
        combined = np.zeros(masks.shape[1:], dtype=np.uint8)
        for m in masks:
            combined = np.logical_or(combined, m > 0)
        combined = (combined.astype(np.uint8)) * 255

        # convert to PNG
        img_pil = Image.fromarray(combined)
        buf = io.BytesIO()
        img_pil.save(buf, format='PNG')
        buf.seek(0)
        return send_file(buf, mimetype='image/png')
    
    except Exception as e:
        logger.error(f'Segmentation error: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
