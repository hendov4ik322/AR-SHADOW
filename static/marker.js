// marker.js
// Работа с маркерами A/B и Light
// Кирилл, всё четенько, связки работают с app.js и shadow.js

/**
 * Найти маркеры по цвету на canvas
 * @param {ImageData} frameData - кадр с камеры
 * @returns {Object} позиции маркеров: {A: {x,y}, B:{x,y}, Light:{x,y}}
 */
function detectMarkers(frameData) {
    const width = frameData.width;
    const height = frameData.height;
    const data = frameData.data;

    // Инициализация центров маркеров
    let sumA = {x:0, y:0, count:0};
    let sumB = {x:0, y:0, count:0};
    let sumLight = {x:0, y:0, count:0};

    // Пробегаем по каждому пикселю
    for (let y = 0; y < height; y+=2) {          // +2 для ускорения
        for (let x = 0; x < width; x+=2) {
            const idx = (y*width + x) * 4;
            const r = data[idx];
            const g = data[idx+1];
            const b = data[idx+2];

            // Маркер A — красный
            if (r > 150 && g < 80 && b < 80) {
                sumA.x += x;
                sumA.y += y;
                sumA.count++;
            }

            // Маркер B — зеленый
            if (g > 150 && r < 80 && b < 80) {
                sumB.x += x;
                sumB.y += y;
                sumB.count++;
            }

            // Маркер Light — синий
            if (b > 150 && r < 80 && g < 80) {
                sumLight.x += x;
                sumLight.y += y;
                sumLight.count++;
            }
        }
    }

    // Вычисляем среднее положение маркеров
    const A = sumA.count ? {x: sumA.x / sumA.count, y: sumA.y / sumA.count} : null;
    const B = sumB.count ? {x: sumB.x / sumB.count, y: sumB.y / sumB.count} : null;
    const Light = sumLight.count ? {x: sumLight.x / sumLight.count, y: sumLight.y / sumLight.count} : null;

    return {A, B, Light};
}

/**
 * Отрисовка маркеров на canvas
 * @param {CanvasRenderingContext2D} ctx - контекст canvas
 * @param {Object} markers - объект {A, B, Light} с координатами
 */
function drawMarkers(ctx, markers) {
    ctx.save();
    ctx.lineWidth = 2;

    if (markers.A) {
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.arc(markers.A.x, markers.A.y, 10, 0, 2*Math.PI);
        ctx.stroke();
    }
    if (markers.B) {
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        ctx.arc(markers.B.x, markers.B.y, 10, 0, 2*Math.PI);
        ctx.stroke();
    }
    if (markers.Light) {
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.arc(markers.Light.x, markers.Light.y, 10, 0, 2*Math.PI);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Вычисление плоскости поля (углы) и света
 * @param {Object} markers - {A,B,Light}
 * @returns {Object} поле с координатами вершин и источник света
 */
function computeField(markers) {
    if (!markers.A || !markers.B) return null;

    // Прямоугольник по диагонали A->B
    const field = {
        topLeft: {x: Math.min(markers.A.x, markers.B.x), y: Math.min(markers.A.y, markers.B.y)},
        bottomRight: {x: Math.max(markers.A.x, markers.B.x), y: Math.max(markers.A.y, markers.B.y)},
        Light: markers.Light
    };
    return field;
}

// Экспортируем функции для app.js
export { detectMarkers, drawMarkers, computeField };
