class Fish {
  constructor(level, canvasWidth, canvasHeight) {
    this.level = level;
    const config = GAME_CONFIG.LEVEL_CONFIG[level - 1];
    this.type = config.type;
    this.sizeType = config.size;
    this.size = GAME_CONFIG.getSizeForLevel(level);
    this.baseSpeed = GAME_CONFIG.getSpeedForLevel(level);
    this.speed = this.baseSpeed;
    
    const spawnSide = Math.floor(Math.random() * 4);
    if (spawnSide === 0) {
      this.x = -this.size;
      this.y = Math.random() * (canvasHeight * 0.7) + this.size;
    } else if (spawnSide === 1) {
      this.x = canvasWidth + this.size;
      this.y = Math.random() * (canvasHeight * 0.7) + this.size;
    } else if (spawnSide === 2) {
      this.x = Math.random() * canvasWidth;
      this.y = -this.size;
    } else {
      this.x = Math.random() * canvasWidth;
      this.y = canvasHeight * 0.7 + this.size;
    }
    
    this.direction = spawnSide === 0 ? 1 : spawnSide === 1 ? -1 : spawnSide === 2 ? 0.5 : -0.5;
    this.angle = Math.random() * Math.PI * 2;
    
    this.targetX = this.x;
    this.targetY = this.y;
    this.swingOffset = Math.random() * Math.PI * 2;
    this.moveTimer = 0;
    this.moveInterval = 40 + Math.random() * 80;
    
    this.eaten = false;
    this.eatAnimation = 0;
    
    this.isFleeing = false;
    this.fleeTimer = 0;
    this.fleeCooldown = 0;
    
    this.leftScreen = false;
  }
  
  update(canvasWidth, canvasHeight, playerX, playerY, playerSize, playerLevel, mode) {
    if (this.eaten || this.leftScreen) {
      if (this.eaten) {
        this.eatAnimation += 0.15;
        this.size *= 0.95;
      }
      return;
    }
    
    const size = this.size;
    this.speed = GAME_CONFIG.getSpeedForLevel(this.level, false, mode);
    
    if (mode !== 'easy' && this.level < playerLevel) {
      if (this.fleeCooldown > 0) {
        this.fleeCooldown--;
      }
      
      if (this.isFleeing) {
        this.fleeTimer--;
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        const fleeSpeed = this.speed * 3;
        this.x += Math.cos(this.angle) * fleeSpeed;
        this.y += Math.sin(this.angle) * fleeSpeed;
        
        if (this.fleeTimer <= 0) {
          this.isFleeing = false;
          this.fleeCooldown = 600;
          this.targetX = this.x + Math.cos(Math.random() * Math.PI * 2) * 100;
          this.targetY = this.y + Math.sin(Math.random() * Math.PI * 2) * 100;
          this.moveTimer = this.moveInterval - 30;
        }
      } else if (this.fleeCooldown <= 0) {
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const detectDistance = playerSize * 3;
        
        if (distance < detectDistance) {
          this.isFleeing = true;
          this.fleeTimer = 120;
          
          this.angle = Math.atan2(dy, dx);
          this.targetX = this.x + Math.cos(this.angle) * 300;
          this.targetY = this.y + Math.sin(this.angle) * 300;
          
          this.x += Math.cos(this.angle) * this.speed * 3;
          this.y += Math.sin(this.angle) * this.speed * 3;
        }
      }
    }
    
    if (!this.isFleeing) {
      this.moveTimer++;
      if (this.moveTimer >= this.moveInterval) {
        this.moveTimer = 0;
        this.moveInterval = 40 + Math.random() * 80;
        
        const edgeBias = Math.random();
        if (edgeBias < 0.4) {
          this.targetX = Math.random() * canvasWidth * 0.2;
        } else if (edgeBias < 0.7) {
          this.targetX = canvasWidth * 0.8 + Math.random() * canvasWidth * 0.2;
        } else if (edgeBias < 0.85) {
          this.targetX = Math.random() * canvasWidth;
          this.targetY = Math.random() * canvasHeight * 0.3 + size;
        } else {
          this.targetX = Math.random() * canvasWidth;
          this.targetY = canvasHeight * 0.6 + Math.random() * canvasHeight * 0.2 + size;
        }
        
        this.targetY = Math.min(Math.max(this.targetY, size), canvasHeight * 0.7 - size);
      }
      
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 3) {
        this.angle = Math.atan2(dy, dx);
        const moveSpeed = Math.min(this.speed * 0.6, distance);
        this.x += Math.cos(this.angle) * moveSpeed;
        this.y += Math.sin(this.angle) * moveSpeed;
      }
    }
    
    const groundY = canvasHeight * 0.85;
    if (this.y > groundY + size) {
      this.y = groundY - size;
      this.angle = -this.angle;
      this.targetY = this.y - Math.random() * 100 - 50;
    }
    
    if (this.x < -size * 2 || this.x > canvasWidth + size * 2 || this.y < -size * 2) {
      this.leftScreen = true;
    }
    
    this.swingOffset += 0.1;
  }
  
  draw(ctx) {
    if (this.eaten && this.eatAnimation > 2) return;
    if (this.leftScreen) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    const size = this.size;
    const swing = Math.sin(this.swingOffset) * 2;
    
    if (this.eaten) {
      ctx.globalAlpha = 1 - this.eatAnimation * 0.3;
      ctx.scale(1 - this.eatAnimation * 0.2, 1 - this.eatAnimation * 0.2);
    }
    
    const fishType = GAME_CONFIG.FISH_TYPES[this.type];
    
    if (this.type === 'clownfish') {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.quadraticCurveTo(size * 0.8, -size * 0.3 + swing, size * 0.5, -size * 0.4 + swing);
      ctx.quadraticCurveTo(0, -size * 0.5 + swing, -size * 0.3, -size * 0.2);
      ctx.lineTo(-size * 0.4, 0);
      ctx.lineTo(-size * 0.3, size * 0.2);
      ctx.quadraticCurveTo(0, size * 0.5 + swing, size * 0.5, size * 0.4 + swing);
      ctx.quadraticCurveTo(size * 0.8, size * 0.3 + swing, size, 0);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-size * 0.1, 0, size * 0.15, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.ellipse(-size * 0.05, 0, size * 0.08, size * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'lionfish') {
      ctx.fillStyle = '#ffa502';
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(size * 0.7, -size * 0.2 + swing);
      ctx.lineTo(size * 0.5, -size * 0.4 + swing);
      ctx.lineTo(0, -size * 0.5 + swing);
      ctx.lineTo(-size * 0.3, -size * 0.3);
      ctx.lineTo(-size * 0.4, 0);
      ctx.lineTo(-size * 0.3, size * 0.3);
      ctx.lineTo(0, size * 0.5 + swing);
      ctx.lineTo(size * 0.5, size * 0.4 + swing);
      ctx.lineTo(size * 0.7, size * 0.2 + swing);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = '#ff8c00';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.2 + i * 0.1, -size * 0.3);
        ctx.lineTo(-size * 0.3 + i * 0.1, -size * 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-size * 0.2 + i * 0.1, size * 0.3);
        ctx.lineTo(-size * 0.3 + i * 0.1, size * 0.6);
        ctx.stroke();
      }
    } else if (this.type === 'shark') {
      ctx.fillStyle = '#8b7355';
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(size * 0.7, -size * 0.15 + swing);
      ctx.lineTo(size * 0.5, -size * 0.35 + swing);
      ctx.lineTo(0, -size * 0.4 + swing);
      ctx.lineTo(-size * 0.1, -size * 0.2);
      ctx.lineTo(-size * 0.5, -size * 0.1);
      ctx.lineTo(-size * 0.6, 0);
      ctx.lineTo(-size * 0.5, size * 0.1);
      ctx.lineTo(-size * 0.1, size * 0.2);
      ctx.lineTo(0, size * 0.4 + swing);
      ctx.lineTo(size * 0.5, size * 0.35 + swing);
      ctx.lineTo(size * 0.7, size * 0.15 + swing);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.moveTo(-size * 0.4, -size * 0.05);
      ctx.lineTo(-size * 0.6, -size * 0.05);
      ctx.lineTo(-size * 0.5, size * 0.05);
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(size * 0.3, -size * 0.05, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  getBounds() {
    return {
      x: this.x - this.size * 0.5,
      y: this.y - this.size * 0.4,
      width: this.size * 1,
      height: this.size * 0.8
    };
  }
}

class FishSystem {
  constructor(canvasWidth, canvasHeight, mode = 'easy') {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.fishes = [];
    this.minFishes = 20;
    this.maxFishes = 30;
    this.spawnTimer = 0;
    this.spawnInterval = 5;
    this.mode = mode;
    
    for (let i = 0; i < this.minFishes; i++) {
      let level;
      if (mode === 'hard') {
        const rand = Math.random();
        if (rand < 1/6) level = 1;
        else if (rand < 1/3) level = 2;
        else if (rand < 1/2) level = 3;
        else level = 4;
      } else {
        level = Math.ceil(Math.random() * 3);
      }
      this.fishes.push(new Fish(level, canvasWidth, canvasHeight));
    }
  }
  
  update(playerX, playerY, playerSize, playerLevel) {
    for (const fish of this.fishes) {
      fish.update(this.canvasWidth, this.canvasHeight, playerX, playerY, playerSize, playerLevel, this.mode);
    }
    
    this.fishes = this.fishes.filter(fish => !fish.eaten || fish.eatAnimation <= 2);
    this.fishes = this.fishes.filter(fish => !fish.leftScreen);
    
    while (this.fishes.length < this.minFishes && this.fishes.length < this.maxFishes) {
      this.spawnFish(playerLevel);
    }
    
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnInterval && this.fishes.length < this.maxFishes && Math.random() < 0.2) {
      this.spawnFish(playerLevel);
      this.spawnTimer = 0;
    }
  }
  
  spawnFish(playerLevel) {
    const rand = Math.random();
    let level;
    
    const lowerLevelFishes = this.fishes.filter(f => f.level < playerLevel && !f.eaten).length;
    const sameLevelFishes = this.fishes.filter(f => f.level === playerLevel && !f.eaten).length;
    const higherLevelFishes = this.fishes.filter(f => f.level > playerLevel && !f.eaten).length;
    
    if (this.mode === 'hard') {
      if (lowerLevelFishes < 2) {
        level = Math.max(1, playerLevel - 1);
      } else if (higherLevelFishes < 3) {
        if (rand < 1/4) {
          level = Math.max(1, playerLevel - 1);
        } else if (rand < 1/2) {
          level = playerLevel;
        } else {
          level = Math.min(GAME_CONFIG.MAX_LEVEL, playerLevel + 1);
        }
      } else {
        if (rand < 1/6) {
          level = Math.max(1, playerLevel - 1);
        } else if (rand < 1/3) {
          level = playerLevel;
        } else {
          level = Math.min(GAME_CONFIG.MAX_LEVEL, playerLevel + 1);
        }
      }
    } else {
      if (lowerLevelFishes < 3) {
        level = Math.max(1, Math.floor(playerLevel * 0.7));
      } else {
        if (rand < 1/3) {
          level = Math.max(1, playerLevel - 1);
        } else if (rand < 2/3) {
          level = playerLevel;
        } else {
          level = Math.min(GAME_CONFIG.MAX_LEVEL, playerLevel + 1);
        }
      }
    }
    
    if (level < 1) level = 1;
    if (level > GAME_CONFIG.MAX_LEVEL) level = GAME_CONFIG.MAX_LEVEL;
    
    this.fishes.push(new Fish(level, this.canvasWidth, this.canvasHeight));
  }
  
  getActiveFishCount() {
    return this.fishes.filter(fish => !fish.eaten).length;
  }
  
  draw(ctx) {
    for (const fish of this.fishes) {
      fish.draw(ctx);
    }
  }
  
  getEatableFishes(playerLevel) {
    return this.fishes.filter(fish => fish.level <= playerLevel && !fish.eaten);
  }
}