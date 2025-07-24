// Get the canvas element and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Animation variables
let animationId;
let x = canvasWidth / 2;
let y = canvasHeight / 2;
let dx = 2;
let dy = 2;
const ballRadius = 20;

// Colors
const ballColor = '#4CAF50';
const backgroundColor = '#ffffff';

// Initialize the canvas
function init() {
    // Clear the canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw the ball
    drawBall();
}

// Draw the ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();
    ctx.closePath();
}

// Update ball position
function update() {
    // Bounce off walls
    if (x + ballRadius > canvasWidth || x - ballRadius < 0) {
        dx = -dx;
    }
    if (y + ballRadius > canvasHeight || y - ballRadius < 0) {
        dy = -dy;
    }
    
    // Update position
    x += dx;
    y += dy;
}

// Main animation loop
function animate() {
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Update and draw
    update();
    drawBall();
    
    // Continue animation
    animationId = requestAnimationFrame(animate);
}

// Start the animation when the page loads
window.addEventListener('load', () => {
    init();
    animate();
});

// Add click event to change ball direction
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Change direction based on click position
    dx = (clickX - x) * 0.1;
    dy = (clickY - y) * 0.1;
});

// Add keyboard controls
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowUp':
            dy = -3;
            break;
        case 'ArrowDown':
            dy = 3;
            break;
        case 'ArrowLeft':
            dx = -3;
            break;
        case 'ArrowRight':
            dx = 3;
            break;
        case ' ':
            // Spacebar pauses/resumes animation
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            } else {
                animate();
            }
            break;
    }
}); 


