// Get the canvas element and its context
let canvas, ctx;

function initializeCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return false;
    }

    ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) {
        console.error('Could not get canvas context!');
        return false;
    }

    console.log('Canvas initialized successfully');
    return true;
}

// Canvas dimensions (will be set after initialization)
let canvasWidth, canvasHeight, halfWidth, halfHeight;

function setCanvasDimensions() {
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    halfWidth = canvasWidth / 2;
    halfHeight = canvasHeight / 2;
    console.log('Canvas dimensions set:', canvasWidth, 'x', canvasHeight);
}


// Base Sprite class (optimized for performance)
class Sprite {


    constructor(x, y, dx, dy, radius, color, speed, isMoving, isCollectable) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.color = color;
        this.speed = speed || 2; // Default speed if not provided

        this.isMoving = isMoving;
        this.isCollectable = isCollectable;

        // Pre-calculate radius squared for collision detection (mathematical optimization)
        this.radiusSquared = radius * radius;
    }

    // Optimized draw method (minimize draw operations)
    draw(ctx) {
        // Draw square sprite
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
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

        // Load coin sprite
        this.coinSheet = new Image();
        this.coinSheet.src = 'brackeys_platformer_assets/sprites/coin.png';
        this.frameWidth = 32;
        this.frameHeight = 32;
        this.totalFrames = 6;
        this.currentFrame = 0;
        this.frameCounter = 0;
        this.frameSpeed = 8;

        // Pre-calculate coin-specific values
        this.glowRadius = radius * 1.1;
    }

    // Override draw method for coins (with sprite animation)
    draw(ctx) {
        if (this.coinSheet.complete) {
            try {
                const scale = 1;
                const sx = this.currentFrame * this.frameWidth;
                const coinDestX = this.x - (this.frameWidth * scale) / 2;
                const coinDestY = this.y - (this.frameHeight * scale) / 2;
                
                // Draw coin sprite
                ctx.drawImage(
                    this.coinSheet,
                    sx, 0,
                    this.frameWidth, this.frameHeight,
                    coinDestX, coinDestY,
                    this.frameWidth * scale, this.frameHeight * scale
                );
                
                // Update animation frame
                this.frameCounter++;
                if (this.frameCounter >= this.frameSpeed) {
                    this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
                    this.frameCounter = 0;
                }
            } catch (error) {
                // Fallback to square if image fails
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            }
        } else {
            // Fallback to square while image loads
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        }
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

// Platform class extending base Sprite (moving platforms with wrapping)
class Platform extends Sprite {
    static speed = 2;
    constructor(x, y, width, height, dx, dy, speed, isMoving, platformType) {
        super(x, y, dx, dy, 0, '#8B4513', speed, isMoving, false); // radius = 0 for rectangular platforms

        this.width = width;
        this.height = height;
        this.platformType = platformType || 'moving';

        // Load platform sprite
        this.platformSheet = new Image();
        this.platformSheet.src = 'brackeys_platformer_assets/sprites/platforms.png';
        
        // Add load event listener to debug image loading
        this.platformSheet.onload = () => {
            console.log('Platform sprite sheet loaded successfully');
        };
        this.platformSheet.onerror = () => {
            console.error('Failed to load platform sprite sheet');
        };
        
        // Pre-calculate platform-specific values
        this.halfWidth = width / 2;
        this.halfHeight = height / 2;
    }

    // Override draw method for platforms (with sprite)
    draw(ctx) {
        if (this.platformSheet.complete) {
            // Draw platform sprite
            try {
                // Draw the top platform sprite at a smaller scale
                ctx.drawImage(
                    this.platformSheet,
                    0, 0,  // Top platform sprite coordinates
                    48, 16, // Source dimensions corrected (original sprite dimensions)
                    this.x - this.halfWidth * 0.5, this.y - this.halfHeight * 0.5,
                    this.width * 0.5, this.height * 0.5
                );
            } catch (error) {
                // Fallback to rectangle if image fails
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.halfWidth, this.y - this.halfHeight, this.width, this.height);
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x - this.halfWidth, this.y - this.halfHeight, this.width, this.height);
            }
        } else {
            // Fallback to rectangle while image loads
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.halfWidth, this.y - this.halfHeight, this.width, this.height);
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - this.halfWidth, this.y - this.halfHeight, this.width, this.height);
        }
    }


    // Enhanced update method for platforms with directional wrapping
    update() {
        if (this.isMoving) {
            // Move platform
            this.x += this.dx;
            this.y += this.dy;

            // Check boundaries and wrap to random position beyond canvas
            if (this.x + this.halfWidth < 0 || this.x - this.halfWidth > canvasWidth ||
                this.y + this.halfHeight < 0 || this.y - this.halfHeight > canvasHeight) {

                // Randomly choose which side to appear from
                const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

                switch (side) {
                    case 0: // Top - beyond upper boundary (vertical movement)
                        this.x = Math.random() * canvasWidth;
                        this.y = -this.halfHeight - Math.random() * 100;
                        this.dx = 0; // No horizontal movement
                        this.dy = Math.random() * 2 + 1; // Move down at 1-3 speed
                        break;
                    case 1: // Right - beyond right boundary (horizontal movement)
                        this.x = canvasWidth + this.halfWidth + Math.random() * 100;
                        this.y = Math.random() * canvasHeight;
                        this.dx = -(Math.random() * 2 + 1); // Move left at 1-3 speed
                        this.dy = 0; // No vertical movement
                        break;
                    case 2: // Bottom - beyond lower boundary (vertical movement)
                        this.x = Math.random() * canvasWidth;
                        this.y = canvasHeight + this.halfHeight + Math.random() * 100;
                        this.dx = 0; // No horizontal movement
                        this.dy = -(Math.random() * 2 + 1); // Move up at 1-3 speed
                        break;
                    case 3: // Left - beyond left boundary (horizontal movement)
                        this.x = -this.halfWidth - Math.random() * 100;
                        this.y = Math.random() * canvasHeight;
                        this.dx = Math.random() * 2 + 1; // Move right at 1-3 speed
                        this.dy = 0; // No vertical movement
                        break;
                }
            }
        }
    }

    // Method to check if player is on platform
    isPlayerOnPlatform(player) {
        // Check if player is above the platform and falling down
        const playerBottom = player.y + player.radius;
        const platformTop = this.y - this.halfHeight;
        const playerTop = player.y - player.radius;
        const platformBottom = this.y + this.halfHeight;

        return player.x >= this.x - this.halfWidth &&
            player.x <= this.x + this.halfWidth &&
            playerBottom >= platformTop &&
            playerTop <= platformBottom &&
            player.dy >= 0; // Player is falling down
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
         this.monsterSheet = new Image();
        // Use different sprites for flying and patrol enemies
        if (this.enemyType === 'patrol') {
            this.monsterSheet.src = 'Monsters_Creatures_Fantasy/Goblin/Run.png';  // Use Goblin for ground enemies
        } else {
            this.monsterSheet.src = 'Monsters_Creatures_Fantasy/Flying eye/Flight.png';  // Flying eye for flying enemies
        }
        
        this.monsterFrameWidth = 150;  // Actual width of each frame in the sprite sheet
        this.monsterFrameHeight = 150;  // Actual height of each frame in the sprite sheet
        this.monsterTotalFrames = 8;  // Number of frames in the sprite sheet
        this.monsterFrameSpeed = 100;
        
        // Add load event listener to debug image loading
        this.monsterSheet.onload = () => {
            console.log('Monster sprite sheet loaded successfully for ' + this.enemyType);
        };
        this.monsterSheet.onerror = () => {
            console.error('Failed to load monster sprite sheet for ' + this.enemyType);
        };

 

        // Pre-calculate enemy-specific values
        this.dangerRadius = radius * 1.2;
        this.patrolStartX = x;
        this.patrolEndX = x + 200; // Patrol range
        this.patrolDirection = 1;
        
        // Monster animation state
        this.monsterCurrentFrame = 0;
        this.monsterFrameCounter = 0;
    }

    // Override draw method for enemies (monster sprite)
    draw(ctx) {
        const scale = 1.5; // Increased scale to make monsters bigger
        // Calculate source x based on current frame
        const sx = this.monsterCurrentFrame * this.monsterFrameWidth;
        
        // Center monster sprite on enemy position
        const monsterDestX = this.x - (this.monsterFrameWidth * scale) / 2;
        const monsterDestY = this.y - (this.monsterFrameHeight * scale) / 2;
        
        // Check if the monster image is loaded
        if (this.monsterSheet.complete) {
            try {
                // Draw the monster sprite
                ctx.drawImage(
                    this.monsterSheet,
                    sx, 0,  // Start at x=sx, y=0 in the sprite sheet
                    this.monsterFrameWidth, this.monsterFrameHeight,  // Width and height of the source frame
                    monsterDestX, monsterDestY,  // Destination position
                    this.monsterFrameWidth * scale, this.monsterFrameHeight * scale  // Scaled size
                );
                
                // Update animation frame
                this.monsterFrameCounter++;
                if (this.monsterFrameCounter >= this.monsterFrameSpeed) {
                    this.monsterCurrentFrame = (this.monsterCurrentFrame + 1) % this.monsterTotalFrames;
                    this.monsterFrameCounter = 0;
                }
            } catch (error) {
                console.error('Error drawing monster sprite:', error);
                // Draw red box as fallback
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
            }
        } else {
            // Draw red box as fallback
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        }
    }

    // Enhanced update method for enemies with boundary wrapping
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

            // Boundary wrapping - enemies appear on opposite side
            if (this.x + this.radius < 0) {
                // Wrap from left to right
                this.x = canvasWidth + this.radius;
            } else if (this.x - this.radius > canvasWidth) {
                // Wrap from right to left
                this.x = -this.radius;
            }

            // Keep ground enemies on ground level
            if (this.enemyType === 'patrol' && this.y + this.radius >= playerObject.groundY) {
                this.y = playerObject.groundY - this.radius;
                this.dy = 0;
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



// Sprite Animation Variables
// Monster sprite setup
const monsterSheet = new Image();
monsterSheet.src = 'Monsters_Creatures_Fantasy/Flying eye/Flight.png';
const monsterFrameWidth = 32;
const monsterFrameHeight = 40;
const monsterTotalFrames = 4;
const monsterFrameSpeed = 100;

// Knight sprite setup
const knightSheet = new Image();
knightSheet.src = 'brackeys_platformer_assets/sprites/knight.png';
const knightFrameWidth = 32;
const knightFrameHeight = 40;
const knightTotalFrames = 4;
let knightCurrentFrame = 0;
let knightFrameCounter = 0;
const knightFrameSpeed = 100;
let knightInitialImagePositionX = 5;

// Manual frame control for cropping
let knightManualFrame = 0;
// Set these to control which frames to loop through (inclusive)
let knightFrameStart = 0; // Change as needed
let knightFrameEnd = knightTotalFrames - 1; // Change as needed

// Draw a specific frame of the knight sprite sheet
function drawKnightFrame(frameIndex) {
    // Clamp frameIndex to valid range
    frameIndex = Math.max(0, Math.min(knightTotalFrames - 1, frameIndex));
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const scale = 2; // Use same scale everywhere

    const sx = frameIndex * knightFrameWidth;
    // Center knight inside player rectangle
    const knightDestX = playerObject.x - (knightFrameWidth * scale) / 2;
    const knightDestY = playerObject.y - (knightFrameHeight * scale) / 2;
     // Clear background
    ctx.drawImage(
        knightSheet,
        sx, 8,
        knightFrameWidth, knightFrameHeight,
        knightDestX, knightDestY,
        knightFrameWidth * scale, knightFrameHeight * scale
    );
}

// Listen for left/right arrow keys to step through frames
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        knightManualFrame--;
        if (knightManualFrame < knightFrameStart) knightManualFrame = knightFrameEnd;
        drawKnightFrame(knightManualFrame);
    } else if (event.key === 'ArrowRight') {
        knightManualFrame++;
        if (knightManualFrame > knightFrameEnd) knightManualFrame = knightFrameStart;
        drawKnightFrame(knightManualFrame);
    }
});

// Draw a specific frame of the knight sprite sheet
// ...existing code...

function drawKnightAnimation() {
    // Clear only the knight area for demo, or whole canvas if needed
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw current frame, scaled up 2x and centered inside player rectangle
    const scale = 2; // Use same scale as manual frame
    const sx = knightCurrentFrame * knightFrameWidth;
    const knightDestX = playerObject.x - (knightFrameWidth * scale) / 2;
    const knightDestY = playerObject.y - (knightFrameHeight * scale) / 2;
    ctx.drawImage(
        knightSheet,
        sx, 0,
        knightFrameWidth, knightFrameHeight,
        knightDestX, knightDestY,
        knightFrameWidth * scale, knightFrameHeight * scale
    );

    // Advance frame
    knightFrameCounter++;
    if (knightFrameCounter >= knightFrameSpeed) {
        knightCurrentFrame = (knightCurrentFrame + 1) % knightTotalFrames;
        knightFrameCounter = 0;
    }

    // requestAnimationFrame is called in animate()

}

// Example usage: call drawKnightAnimation() inside your main animation loop (e.g. animate())

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

// Function to spawn new enemies
function spawnNewEnemy() {
    enemySpawnCount++;
    const isFlying = Math.random() < 0.5; // 50% chance for flying enemy

    if (isFlying) {
        // Spawn flying enemy at random height
        const spawnX = Math.random() < 0.5 ? -20 : canvasWidth + 20; // Left or right side
        const spawnY = Math.random() * (canvasHeight - 200) + 100; // Random height
        const direction = spawnX < 0 ? 1 : -1; // Move towards center

        createEnemy(
            spawnX, spawnY,
            direction * (1 + enemySpeedMultiplier), 0,
            12, '#ff0000',
            1 + enemySpeedMultiplier, true, 'flying'
        );
        console.log('New flying enemy spawned!');
    } else {
        // Spawn ground enemy
        const spawnX = Math.random() < 0.5 ? -20 : canvasWidth + 20; // Left or right side
        const direction = spawnX < 0 ? 1 : -1; // Move towards center

        createEnemy(
            spawnX, playerObject.groundY - 12,
            direction * (1 + enemySpeedMultiplier), 0,
            15, '#ff0000',
            1 + enemySpeedMultiplier, true, 'patrol'
        );
        console.log('New ground enemy spawned!');
    }
}

// Function to spawn new coin at random position
function spawnNewCoin() {
    const coinRadius = Math.random() * 5 + 8; // Random size between 8-13
    const spawnX = Math.random() * (canvasWidth - coinRadius * 2) + coinRadius;
    const spawnY = Math.random() * (canvasHeight - coinRadius * 2) + coinRadius;

    createCoin(spawnX, spawnY, 0, 0, coinRadius, '#ffd700', 0, false);
    console.log('New coin spawned at:', spawnX, spawnY);
}

// Optimized sprite rendering function (batch operations)
function renderAllSprites() {
    if (!ctx) {
        console.error('Canvas context not available for rendering!');
        return;
    }

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

                // Track total coins collected
                totalCoinsCollected++;

                // Increase enemy speed every 5 coins
                if (totalCoinsCollected % 5 === 0) {
                    enemySpeedMultiplier += 0.2;
                    console.log('Enemy speed increased! Multiplier:', enemySpeedMultiplier);

                    // Apply speed increase to all existing enemies
                    for (let j = 0; j < arrWithEnemies.length; j++) {
                        const enemy = arrWithEnemies[j];
                        if (enemy.enemyType === 'patrol') {
                            enemy.dx = (enemy.dx > 0 ? 1 : -1) * (1 + enemySpeedMultiplier);
                        } else if (enemy.enemyType === 'flying') {
                            enemy.dx = (enemy.dx > 0 ? 1 : -1) * (1 + enemySpeedMultiplier);
                        }
                    }
                }

                // Spawn new enemy every 5 coins (starting from 5)
                if (totalCoinsCollected % 5 === 0 && totalCoinsCollected > 0) {
                    spawnNewEnemy();
                }

                // Spawn new coin immediately
                spawnNewCoin();
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
let animationId = null;

// Enemy management variables
let enemySpeedMultiplier = 1;
let totalCoinsCollected = 0;
let enemySpawnCount = 0;

let playerObject;

function initializePlayer() {
    playerObject = {
        x: halfWidth,
        y: canvasHeight - playerRadius, // Start at bottom boundary
        dx: 0,
        dy: 0,
        radius: 20,
        color: '#4CAF50',
        speed: 2,
        isMoving: false,
        isDead: false,
        amountOfCoins: 0,
        onGround: true,
        gravity: 0.6,
        jumpPower: -15,
        moveSpeed: 4,
        groundY: canvasHeight - playerRadius
    };
    console.log('Player initialized at:', playerObject.x, playerObject.y);
}



// Pre-calculate boundary conditions (mathematical optimization)
const playerRadius = 20; // Match playerObject.radius
const maxX = canvasWidth - playerRadius;
const minX = playerRadius;
const maxY = canvasHeight - playerRadius;
const minY = playerRadius;

// Colors (batch similar operations)
const ballColor = '#4CAF50';
const backgroundColor = '#ffffff';

// Pre-calculate frequently used values
const clickMultiplier = 0.1;
const arrowSpeed = 3;



// Initialize the canvas (batch operations)
function init() {
    console.log('Initializing game...');

    // Initialize canvas and dimensions
    if (!initializeCanvas()) {
        console.error('Failed to initialize canvas!');
        return false;
    }

    setCanvasDimensions();
    initializePlayer();

    // Single clear operation instead of multiple
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw the ball
    

    console.log('Game initialized successfully');
    return true;
}

// Optimized player drawing (green square)
// function drawBall() {
//     // Draw green square player
//     ctx.fillStyle = ballColor;
//     ctx.fillRect(playerObject.x - playerObject.radius, playerObject.y - playerObject.radius, playerObject.radius * 2, playerObject.radius * 2);

//     // Draw border for better visibility
//     ctx.strokeStyle = '#2d5a2d';
//     ctx.lineWidth = 2;
//     ctx.strokeRect(playerObject.x - playerObject.radius, playerObject.y - playerObject.radius, playerObject.radius * 2, playerObject.radius * 2);
// }

// Draw coin counter in top right corner
function drawCoinCounter() {
    const counterX = canvasWidth - 150;
    const counterY = 30;
    const coinSize = 20;

    // Draw background for counter
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(counterX - 10, counterY - 10, 140, 40);

    // Draw coin icon
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(counterX, counterY, coinSize, coinSize);
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.strokeRect(counterX, counterY, coinSize, coinSize);

    // Draw "x" symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('x', counterX + coinSize + 10, counterY + coinSize / 2);

    // Draw coin count
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerObject.amountOfCoins.toString(), counterX + coinSize + 25, counterY + coinSize / 2);
}

// Mario-style physics update
function update() {
    // Apply gravity
    if (!playerObject.onGround) {
        playerObject.dy += playerObject.gravity;
    }

    // Update position
    playerObject.x += playerObject.dx;
    playerObject.y += playerObject.dy;

    // Check platform collisions
    playerObject.onGround = false;
    for (let i = 0; i < arrWithPlatforms.length; i++) {
        const platform = arrWithPlatforms[i];
        if (platform.isPlayerOnPlatform(playerObject)) {
            // Player is on platform
            playerObject.onGround = true;
            playerObject.y = platform.y - platform.halfHeight - playerObject.radius;
            playerObject.dy = 0;
            break;
        }
    }

    // Check ground collision
    if (playerObject.y + playerObject.radius >= playerObject.groundY) {
        playerObject.onGround = true;
        playerObject.y = playerObject.groundY - playerObject.radius;
        playerObject.dy = 0;
    }

    // Horizontal boundary checking
    if (playerObject.x >= maxX) {
        playerObject.x = maxX;
        playerObject.dx = 0;
    }
    if (playerObject.x <= minX) {
        playerObject.x = minX;
        playerObject.dx = 0;
    }
}

// Main animation loop (optimized rendering)
function animate() {
    if (!ctx || !canvas) {
        console.error('Canvas not available for animation!');
        return;
    }

    // Single clear operation for the entire canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw knight animation (demo)
    drawKnightAnimation();

    // Batch update and draw operations
    update();
    

    // Update and render all sprites (batch operations)
    updateAllSprites();
    renderAllSprites();

    // Draw UI elements
    drawCoinCounter();

    // Continue animation
    animationId = requestAnimationFrame(animate);
}

// Start the animation when the page loads
window.addEventListener('load', () => {
    console.log('Page loaded, initializing...');

    if (!init()) {
        console.error('Failed to initialize game!');
        return;
    }

    // Create 5 moving platforms in a stack
    // Create initial enemies and coins
    console.log('Creating sprites...');

    // Create 3 ground enemies
    createEnemy(100, playerObject.groundY - 15, 1, 0, 15, '#ff0000', 1, true, 'patrol');
    createEnemy(300, playerObject.groundY - 15, -1, 0, 15, '#ff0000', 1, true, 'patrol');
    createEnemy(500, playerObject.groundY - 15, 1, 0, 15, '#ff0000', 1, true, 'patrol');

    // Create 2 flying enemies
    createEnemy(200, 150, -1, 0, 12, '#ff0000', 1, true, 'flying');
    createEnemy(400, 200, 1, 0, 12, '#ff0000', 1, true, 'flying');

    // Create coins
    createCoin(300, 300, 0, 0, 10, '#ffd700', 0, false); // Gold coin
    createCoin(400, 150, 0, 0, 8, '#ffd700', 0, false);  // Gold coin

    // Create 5 platforms in a stack that move and wrap (with smaller size)
    createPlatform(100, 500, 100, 20, 2, 0, 1, true, 'moving'); // Platform 1 - starts moving right
    createPlatform(300, 450, 100, 20, -1.5, 0, 1, true, 'moving'); // Platform 2 - starts moving left
    createPlatform(500, 400, 100, 20, 0, -1, 1, true, 'moving'); // Platform 3 - starts moving up
    createPlatform(200, 350, 100, 20, 1, 0, 1, true, 'moving'); // Platform 4 - starts moving right
    createPlatform(400, 300, 100, 20, -1, 0, 1, true, 'moving'); // Platform 5 - starts moving left

    console.log('Starting animation...');
    animate();
});

// Optimized click event (efficient position calculation)


// Mario-style keyboard controls
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
        case ' ':
            // Jump only when on ground
            if (playerObject.onGround) {
                playerObject.dy = playerObject.jumpPower;
                playerObject.onGround = false;
            }
            break;
        case 'ArrowLeft':
            playerObject.dx = -playerObject.moveSpeed;
            break;
        case 'ArrowRight':
            playerObject.dx = playerObject.moveSpeed;
            break;
    }
});

// Stop horizontal movement when keys are released
document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            playerObject.dx = 0;
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


