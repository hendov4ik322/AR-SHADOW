// shadow.js
// Кирилл, всё четенько, братишка-братон-братим-братон!
//
// Использование:
// drawShadow(ctx, mask, field);

function drawShadow(ctx, mask, field) {
    if (!mask || !field || !field.Light) return;

    const light = field.Light;

    // Настройки тени
    const shadowColor = 'rgba(0,0,0,0.3)';
    const shadowOffset = 50; // как далеко отбрасывается тень

    // Проходим по маске объекта (предположим, mask — 2D массив 0/1 или ImageData)
    // Для простоты предполагаем mask как ImageData
    const width = mask.width;
    const height = mask.height;
    const data = mask.data;

    ctx.save();
    ctx.fillStyle = shadowColor;

    for (let y = 0; y < height; y+=2) {       // шаг +2 для скорости
        for (let x = 0; x < width; x+=2) {
            const idx = (y*width + x)*4;
            const alpha = data[idx+3];       // используем канал alpha
            if (alpha > 50) {
                // Вектор от объекта к источнику света
                const dx = x - light.x;
                const dy = y - light.y;

                // Тень — в противоположную сторону
                const shadowX = x + dx * shadowOffset/100;
                const shadowY = y + dy * shadowOffset/100;

                ctx.fillRect(shadowX, shadowY, 2, 2); // маленькие квадратики для тени
            }
        }
    }

    ctx.restore();
}

// Экспорт
export { drawShadow };
