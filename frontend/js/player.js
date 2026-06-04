class Player {
  constructor(x, y, mode = 'easy') {
    this.x = x;
    this.y = y;
    this.level = 1;
    this.experience = 0;
    this.score = 0;
    this.size = GAME_CONFIG.getSizeForLevel(1);
    this.speed = GAME_CONFIG.getSpeedForLevel(1, true, mode);
    this.targetX = x;
    this.targetY = y;
    this.angle = 0;
    this.swingOffset = 0;
    this.isGrowing = false;
    this.growProgress = 0;
    this.targetSize = this.size;
    this.keys = { w: false, a: false, s: false, d: false };
    this.hearts = 2;
    this.maxHearts = 4;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.mode = mode;
  }
  
  update(mouseX, mouseY, canvasWidth, canvasHeight, useKeyboard = false) {
    if (useKeyboard) {
      let dx = 0;
      let dy = 0;
      
      if (this.keys.w) dy -= this.speed;
      if (this.keys.s) dy += this.speed;
      if (this.keys.a) dx -= this.speed;
      if (this.keys.d) dx += this.speed;
      
      if (dx !== 0 || dy !== 0) {
        this.angle = Math.atan2(dy, dx);
        this.x += dx;
        this.y += dy;
      }
    } else {
      this.targetX = mouseX;
      this.targetY = mouseY;
      
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        this.angle = Math.atan2(dy, dx);
        const moveSpeed = Math.min(this.speed, distance);
        this.x += Math.cos(this.angle) * moveSpeed;
        this.y += Math.sin(this.angle) * moveSpeed;
      }
    }
    
    this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
    this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));
    
    this.swingOffset += 0.15;
    
    if (this.invincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
      }
    }
    
    if (this.isGrowing) {
      this.growProgress += 0.05;
      this.size = this.targetSize * (1 - this.growProgress) + this.targetSize * this.growProgress;
      if (this.growProgress >= 1) {
        this.isGrowing = false;
        this.growProgress = 0;
      }
    }
  }
  
  setKey(key, value) {
    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = value;
    }
  }
  
  addExperience(exp) {
    this.experience += exp;
    this.score += exp;
    
    const expNeeded = GAME_CONFIG.getExpForLevel(this.level);
    if (this.experience >= expNeeded && this.level < GAME_CONFIG.MAX_LEVEL) {
      this.experience -= expNeeded;
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.targetSize = GAME_CONFIG.getSizeForLevel(this.level);
    this.speed = GAME_CONFIG.getSpeedForLevel(this.level, true, this.mode);
    this.isGrowing = true;
    this.growProgress = 0;
    this.hearts = Math.min(this.hearts + 1, this.maxHearts);
  }
  
  loseHeart() {
    if (!this.invincible && this.hearts > 0) {
      this.hearts--;
      this.invincible = true;
      this.invincibleTimer = 120;
      return this.hearts <= 0;
    }
    return false;
  }
  
  isAlive() {
    return this.hearts > 0;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    if (this.invincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    const size = this.size;
    const swing = Math.sin(this.swingOffset) * 3;
    
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.quadraticCurveTo(size - 5, -size * 0.3, size * 0.6, -size * 0.4 + swing);
    ctx.quadraticCurveTo(0, -size * 0.6 + swing * 1.5, -size * 0.3, -size * 0.2);
    ctx.quadraticCurveTo(-size * 0.5, size * 0.1, -size * 0.3, size * 0.3);
    ctx.quadraticCurveTo(0, size * 0.5 + swing * 1.5, size * 0.6, size * 0.4 + swing);
    ctx.quadraticCurveTo(size - 5, size * 0.3, size, 0);
    ctx.fill();
    
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(size * 0.5, -size * 0.1);
    ctx.lineTo(size * 0.3, -size * 0.3 + swing);
    ctx.lineTo(size * 0.1, -size * 0.1);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(size * 0.4, -size * 0.1, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size * 0.1);
    ctx.lineTo(-size * 0.5, size * 0.2);
    ctx.stroke();
    
    ctx.restore();
  }
  
  getBounds() {
    return {
      x: this.x - this.size * 0.6,
      y: this.y - this.size * 0.5,
      width: this.size * 1.2,
      height: this.size
    };
  }
}