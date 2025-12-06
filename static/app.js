const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const button = document.getElementById('capture-btn');

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
      video.srcObject = stream;
      video.play();
  })
  .catch(err => console.error("Camera error:", err));

button.addEventListener('click', async () => {
    // Снимаем кадр с видео
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    
    const blob = await (await fetch(dataUrl)).blob();
    const formData = new FormData();
    formData.append('frame', blob, 'frame.png');

    // Отправка на сервер
    const response = await fetch('/seg', { method: 'POST', body: formData });
    if (!response.ok) {
        alert("Ошибка при генерации тени");
        return;
    }

    // Получаем маску и рисуем её поверх видео
    const maskBlob = await response.blob();
    const maskImg = new Image();
    maskImg.onload = () => { ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height); };
    maskImg.src = URL.createObjectURL(maskBlob);
});
