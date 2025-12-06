# seg/__init__.py
"""
Пакет seg — сегментация объектов для AR Shadow проекта.

Структура:
seg/
├── __init__.py        <- этот файл
├── model_loader.py    <- загрузка YOLOv8n-seg
└── segmentor.py       <- функции сегментации и постобработки

Импортируя пакет seg, мы сразу можем:
    from seg import model, segment
"""

# импорт модели из model_loader
from .model_loader import load_model

# импорт функции сегментации
from .segmentor import segment

# Загружаем модель при импорте пакета (один раз)
model = load_model()

# Паттерн: segment(frame, model=model) — используем для сегментации
