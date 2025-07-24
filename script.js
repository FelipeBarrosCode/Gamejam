// Get the canvas element and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: false });

// Pre-calculate canvas dimensions (mathematical optimization)
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const halfWidth = canvasWidth / 2;
const halfHeight = canvasHeight / 2;


// Base Sprite class (optimized for performance)
class Sprite {

    
    constructor(x, y, dx, dy, radius, color, speed, isMoving, isCollectable) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.color = color;
        this.speed = speed || Sprite.speed;
        this.isMoving = isMoving;
        this.isCollectable = isCollectable;
        
        // Pre-calculate radius squared for collision detection (mathematical optimization)
        this.radiusSquared = radius * radius;
    }

    // Optimized draw method (minimize draw operations)
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    // Optimized update method (efficient mathematical expressions)
    update() {
        if (this.isMoving) {
            this.x += this.dx;
            this.y += this.dy;
        }
    }
    
    // Collision detection method (batch operations)
    checkCollision(otherSprite) {
        const dx = this.x - otherSprite.x;
        const dy = this.y - otherSprite.y;
        const distanceSquared = dx * dx + dy * dy;
        const combinedRadius = this.radius + otherSprite.radius;
        return distanceSquared <= combinedRadius * combinedRadius;
    }
}

// Coin class extending base Sprite (collectable items)
class Coin extends Sprite {
    static speed = 2;
    constructor(x, y, dx, dy, radius, color, speed, isMoving) {
        super(x, y, dx, dy, radius, color, speed, isMoving, true); // isCollectable = true
        
        this.coinValue = 1;
        this.collected = false;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.05; // Independent rotation speed
        
        // Pre-calculate coin-specific values
        this.glowRadius = radius * 1.1;
    }
    
    // Override draw method for coins (visual effects)
    draw(ctx) {
        // Draw glow effect
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fill();
        ctx.closePath();
        
        // Draw main coin with rotation
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        // Draw coin symbol
        ctx.fillStyle = '#b8860b';
        ctx.font = `${this.radius * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        ctx.restore();
    }
    
    // Enhanced update method for coins
    update() {
        super.update();
        
        // Update rotation
        this.rotationAngle += this.rotationSpeed;
        
        // Bounce effect for floating coins
        if (this.isMoving) {
            this.y += Math.sin(Date.now() * 0.003) * 0.5;
        }
    }
    
    // Method to handle collection
    collect(player) {
        if (!this.collected && this.checkCollision(player)) {
            this.collected = true;
            player.amountOfCoins += this.coinValue;
            return true; // Collection occurred
        }
        return false;
    }
}

// Platform class extending base Sprite (static/moving platforms)
class Platform extends Sprite {
    static speed = 2;
    constructor(x, y, width, height, dx, dy, speed, isMoving, platformType) {
        super(x, y, dx, dy, 0, '#8B4513', speed, isMoving, false); // radius = 0 for rectangular platforms
        
        this.width = width;
        this.height = height;
        this.platformType = platformType || 'normal'; // normal, moving, breakable
        this.originalX = x;
        this.originalY = y;
        this.moveDistance = 100; // How far the platform moves
        this.moveDirection = 1;
        
        // Pre-calculate platform-specific values
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
    }
    
    // Override draw method for platforms (rectangular shape)
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.halfWidth, this.y - this.halfHeight, this.width, this.height);
        
        // Draw platform border
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.halfWidth, this.y - this.halfHeight, this.width, this.height);
        
        // Draw platform type indicator
        if (this.platformType === 'moving') {
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(this.x - this.halfWidth + 5, this.y - this.halfHeight + 5, 10, 10);
        }
    }
    
    // Enhanced update method for platforms
    update() {
        if (this.isMoving && this.platformType === 'moving') {
            // Move platform back and forth
            this.x += this.dx * this.moveDirection;
            
            // Change direction when reaching limits
            if (this.x > this.originalX + this.moveDistance || this.x < this.originalX - this.moveDistance) {
                this.moveDirection *= -1;
            }
        }
    }
    
    // Method to check if player is on platform
    isPlayerOnPlatform(player) {
        return player.x >= this.x - this.halfWidth &&
               player.x <= this.x + this.halfWidth &&
               player.y + player.radius >= this.y - this.halfHeight &&
               player.y + player.radius <= this.y + this.halfHeight;
    }
}

// Enemy class extending base Sprite (dangerous entities)
class Enemy extends Sprite {
    static speed = 2;
    constructor(x, y, dx, dy, radius, color, speed, isMoving, enemyType) {
        super(x, y, dx, dy, radius, color, speed, isMoving, false); // isCollectable = false
        
        this.enemyType = enemyType || 'basic'; // basic, patrol, flying
        this.isDangerous = true;
        this.damageAmount = 1;
        this.isDead = false;
        this.health = 1;
        this.attackCooldown = 0;
        this.attackRange = radius * 2;
        
        // Pre-calculate enemy-specific values
        this.dangerRadius = radius * 1.2;
        this.patrolStartX = x;
        this.patrolEndX = x + 200; // Patrol range
        this.patrolDirection = 1;
    }
    
    // Override draw method for enemies (visual distinction)
    draw(ctx) {
        // Draw danger indicator
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        // Draw main enemy
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        // Draw enemy eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        
        ctx.beginPath();
        ctx.arc(this.x + this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
    
    // Enhanced update method for enemies
    update() {
        if (!this.isDead) {
            super.update();
            
            // Enemy-specific behavior based on type
            switch (this.enemyType) {
                case 'patrol':
                    this.patrolBehavior();
                    break;
                case 'flying':
                    this.flyingBehavior();
                    break;
                default:
                    this.basicBehavior();
                    break;
            }
            
            // Boundary checking
            if (this.x >= maxX || this.x <= minX) {
                this.dx = -this.dx;
            }
            if (this.y >= maxY || this.y <= minY) {
                this.dy = -this.dy;
            }
        }
    }
    
    // Patrol behavior
    patrolBehavior() {
        if (this.x >= this.patrolEndX || this.x <= this.patrolStartX) {
            this.patrolDirection *= -1;
        }
        this.x += this.speed * this.patrolDirection;
    }
    
    // Flying behavior
    flyingBehavior() {
        this.y += Math.sin(Date.now() * 0.002) * 0.5;
    }
    
    // Basic behavior
    basicBehavior() {
        // Simple movement
    }
    
    // Method to handle collision with player
    handlePlayerCollision(player) {
        if (!this.isDead && this.checkCollision(player)) {
            player.isDead = true;
            return true; // Collision occurred
        }
        return false;
    }
    
    // Method to take damage
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isDead = true;
            return true; // Enemy died
        }
        return false;
    }
}

// Sprite arrays (batch similar operations)
let arrWithEnemies = [];
let arrWithCoins = [];
let arrWithPlatforms = [];

// Helper functions for sprite management (optimized operations)
function createEnemy(x, y, dx, dy, radius, color, speed, isMoving, enemyType) {
    const enemy = new Enemy(x, y, dx, dy, radius, color, speed, isMoving, enemyType);
    arrWithEnemies.push(enemy);
    return enemy;
}

function createCoin(x, y, dx, dy, radius, color, speed, isMoving) {
    const coin = new Coin(x, y, dx, dy, radius, color, speed, isMoving);
    arrWithCoins.push(coin);
    return coin;
}

function createPlatform(x, y, width, height, dx, dy, speed, isMoving, platformType) {
    const platform = new Platform(x, y, width, height, dx, dy, speed, isMoving, platformType);
    arrWithPlatforms.push(platform);
    return platform;
}

// Optimized sprite rendering function (batch operations)
function renderAllSprites() {
    // Render platforms first (background)
    for (let i = 0; i < arrWithPlatforms.length; i++) {
        const platform = arrWithPlatforms[i];
        platform.draw(ctx);
    }
    
    // Render coins
    for (let i = 0; i < arrWithCoins.length; i++) {
        const coin = arrWithCoins[i];
        if (!coin.collected) {
            coin.draw(ctx);
        }
    }
    
    // Render enemies last (foreground)
    for (let i = 0; i < arrWithEnemies.length; i++) {
        const enemy = arrWithEnemies[i];
        if (!enemy.isDead) {
            enemy.draw(ctx);
        }
    }
}

// Optimized sprite update function (batch operations)
function updateAllSprites() {
    // Update platforms
    for (let i = 0; i < arrWithPlatforms.length; i++) {
        const platform = arrWithPlatforms[i];
        platform.update();
        
        // Check if player is on platform
        if (platform.isPlayerOnPlatform(playerObject)) {
            // Handle platform collision (could add jumping mechanics here)
        }
    }
    
    // Update coins
    for (let i = 0; i < arrWithCoins.length; i++) {
        const coin = arrWithCoins[i];
        if (!coin.collected) {
            coin.update();
            // Check collection
            if (coin.collect(playerObject)) {
                // Remove collected coin (optimized array removal)
                arrWithCoins.splice(i, 1);
                i--; // Adjust index after removal
            }
        }
    }
    
    // Update enemies
    for (let i = 0; i < arrWithEnemies.length; i++) {
        const enemy = arrWithEnemies[i];
        if (!enemy.isDead) {
            enemy.update();
            // Check collision with player
            enemy.handlePlayerCollision(playerObject);
        }
    }
}

// Animation variables with pre-calculated values
let animationId;

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
    amountOfCoins: 0,
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
    
    // Update and render all sprites (batch operations)
    updateAllSprites();
    renderAllSprites();
    
    // Continue animation
    animationId = requestAnimationFrame(animate);
}

// Start the animation when the page loads
window.addEventListener('load', () => {
    init();
    
    // Create some example sprites (batch initialization)
    createEnemy(100, 100, 1, 1, 15, '#ff4444', 1, true, 'patrol');
    createEnemy(200, 200, -1, 1, 12, '#ff6666', 1.5, true, 'flying');
    createCoin(300, 300, 0, 0, 10, '#ffdd00', 0, false); // Gold coin
    createCoin(400, 150, 0, 0, 8, '#ffdd00', 0, false);  // Gold coin
    createPlatform(400, 500, 200, 20, 1, 0, 1, true, 'moving'); // Moving platform
    createPlatform(100, 450, 150, 20, 0, 0, 0, false, 'normal'); // Static platform
    
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


