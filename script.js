// Get the canvas element and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: false });

// Pre-calculate canvas dimensions (mathematical optimization)
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const halfWidth = canvasWidth / 2;
const halfHeight = canvasHeight / 2;


class Sprite {
    constructor(x, y, dx, dy, radius, color, speed, isMoving, isDead,isDangerous) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.isMoving = isMoving;
        this.isJumping = isJumping;
        this.isFalling = isFalling;
        this.isDead = isDead;
        this.isDangerous = isDangerous;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
    }
    
}

// Animation variables with pre-calculated values


let playerObject = {
    x: halfWidth,
    y: halfHeight,
    dx: 2,
    dy: 2,
    radius: 20,
    color: '#4CAF50',
    speed: 2,
    isMoving: false,
    isJumping: false,
    isFalling: false,
    isDead: false,
}



// Pre-calculate boundary conditions (mathematical optimization)
const maxX = canvasWidth - ballRadius;
const minX = ballRadius;
const maxY = canvasHeight - ballRadius;
const minY = ballRadius;

// Colors (batch similar operations)
const ballColor = '#4CAF50';
const backgroundColor = '#ffffff';

// Pre-calculate frequently used values
const clickMultiplier = 0.1;
const arrowSpeed = 3;



// Initialize the canvas (batch operations)
function init() {
    // Single clear operation instead of multiple
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw the ball
    drawBall();
}

// Optimized ball drawing (minimize draw operations)
function drawBall() {
    ctx.beginPath();
    ctx.arc(playerObject.x, playerObject.y, playerObject.radius, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();
    ctx.closePath();
}

// Optimized position update (efficient mathematical expressions)
function update() {
    // Simplified boundary checking with pre-calculated values
    if (playerObject.x >= maxX || playerObject.x <= minX) {
        playerObject.dx = -playerObject.dx;
    }
    if (playerObject.y >= maxY || playerObject.y <= minY) {
        playerObject.dy = -playerObject.dy;
    }
    
    // Direct position update
    playerObject.x += playerObject.dx;
    playerObject.y += playerObject.dy;
}

// Main animation loop (optimized rendering)
function animate() {
    // Single clear operation for the entire canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Batch update and draw operations
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

// Optimized click event (efficient position calculation)
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Simplified direction calculation
    playerObject.dx = (clickX - playerObject.x) * clickMultiplier;
    playerObject.dy = (clickY - playerObject.y) * clickMultiplier;
});

// Optimized keyboard controls (batch similar operations)
document.addEventListener('keydown', (event) => {
    switch(event.key) {
        case 'ArrowUp':
            playerObject.dy = -arrowSpeed;
            break;
        case 'ArrowDown':
            playerObject.dy = arrowSpeed;
            break;
        case 'ArrowLeft':
            playerObject.dx = -arrowSpeed;
            break;
        case 'ArrowRight':
            playerObject.dx = arrowSpeed;
            break;
        case ' ':
            // Efficient pause/resume logic
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            } else {
                animate();
            }
            break;
    }
});

// Memory management: Cleanup function for proper disposal
function cleanup() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// Cleanup on page unload to prevent memory leaks
window.addEventListener('beforeunload', cleanup); 


