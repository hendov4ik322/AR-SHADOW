console.log('Scripts loaded successfully');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let video = null;
let animationId = null;
let isProcessing = false;
let frameCount = 0;

async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });
        
        video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log('Webcam started:', canvas.width, 'x', canvas.height);
            processFrame();
        };
        
        video.onerror = (error) => {
            console.error('Video error:', error);
        };
    } catch (error) {
        console.error('Error accessing webcam:', error);
        alert('Cannot access webcam. Check permissions.');
    }
}

function processFrame() {
    if (!video) {
        console.error('Video not initialized');
        return;
    }
    
    // Draw video frame
    try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (error) {
        console.error('Error drawing video:', error);
        animationId = requestAnimationFrame(processFrame);
        return;
    }
    
    // Process every 3rd frame to avoid overloading
    frameCount++;
    if (frameCount % 3 === 0 && !isProcessing) {
        sendFrame();
    }
    
    animationId = requestAnimationFrame(processFrame);
}

async function sendFrame() {
    if (isProcessing) return;
    
    isProcessing = true;
    
    try {
        canvas.toBlob(async (blob) => {
            if (!blob) {
                console.error('Failed to create blob');
                isProcessing = false;
                return;
            }
            
            const formData = new FormData();
            formData.append('frame', blob, 'frame.jpg');
            
            try {
                const response = await fetch('/seg', {
                    method: 'POST',
                    body: formData,
                    timeout: 5000
                });
                
                if (response.ok) {
                    const maskBlob = await response.blob();
                    const maskUrl = URL.createObjectURL(maskBlob);
                    const maskImg = new Image();
                    
                    maskImg.onload = () => {
                        ctx.globalAlpha = 0.5;
                        ctx.drawImage(maskImg, 0, 0);
                        ctx.globalAlpha = 1.0;
                        URL.revokeObjectURL(maskUrl);
                    };
                    
                    maskImg.onerror = () => {
                        console.error('Failed to load mask image');
                        URL.revokeObjectURL(maskUrl);
                    };
                    
                    maskImg.src = maskUrl;
                } else {
                    console.error('Server error:', response.status);
                }
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
            } finally {
                isProcessing = false;
            }
        }, 'image/jpeg', 0.7);
    } catch (error) {
        console.error('Error in sendFrame:', error);
        isProcessing = false;
    }
}

document.addEventListener('DOMContentLoaded', startWebcam);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});
