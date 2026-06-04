class GameLogic {
  constructor(player, fishSystem, mode = 'easy') {
    this.player = player;
    this.fishSystem = fishSystem;
    this.eatParticles = [];
    this.damageParticles = [];
    this.gameOver = false;
    this.mode = mode;
  }
  
  checkCollision(playerBounds, fishBounds) {
    const playerCenterX = playerBounds.x + playerBounds.width / 2;
    const playerCenterY = playerBounds.y + playerBounds.height / 2;
    const fishCenterX = fishBounds.x + fishBounds.width / 2;
    const fishCenterY = fishBounds.y + fishBounds.height / 2;
    
    const dx = playerCenterX - fishCenterX;
    const dy = playerCenterY - fishCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (playerBounds.width + fishBounds.width) / 3.5;
  }
  
  update() {
    if (this.gameOver) return;
    
    const playerBounds = this.player.getBounds();
    const allFishes = this.fishSystem.fishes.filter(fish => !fish.eaten);
    
    for (const fish of allFishes) {
      const fishBounds = fish.getBounds();
      if (this.checkCollision(playerBounds, fishBounds)) {
        if (fish.level < this.player.level) {
          this.eatFish(fish);
        } else if (fish.level > this.player.level) {
          this.damagePlayer(fish);
        } else if (this.player.level === 1 && fish.level === 1) {
          this.eatFish(fish);
        }
      }
    }
    
    this.eatParticles = this.eatParticles.filter(p => p.life > 0);
    for (const particle of this.eatParticles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.size *= 0.98;
    }
    
    this.damageParticles = this.damageParticles.filter(p => p.life > 0);
    for (const particle of this.damageParticles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.size *= 0.98;
    }
  }
  
  damagePlayer(fish) {
    const gameOver = this.player.loseHeart();
    if (gameOver) {
      this.gameOver = true;
    }
    
    for (let i = 0; i < 8; i++) {
      this.damageParticles.push({
        x: this.player.x,
        y: this.player.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: Math.random() * 6 + 3,
        life: 20,
        color: '#ff4444'
      });
    }
  }
  
  isGameOver() {
    return this.gameOver;
  }
  
  eatFish(fish) {
    fish.eaten = true;
    
    const expGained = GAME_CONFIG.getExpForLevel(fish.level) / 3;
    this.player.addExperience(expGained);
    
    for (let i = 0; i < 10; i++) {
      this.eatParticles.push({
        x: fish.x,
        y: fish.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 8 + 4,
        life: 30,
        color: GAME_CONFIG.FISH_TYPES[fish.type].color
      });
    }
  }
  
  draw(ctx) {
    for (const particle of this.eatParticles) {
      ctx.save();
      ctx.globalAlpha = particle.life / 30;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    for (const particle of this.damageParticles) {
      ctx.save();
      ctx.globalAlpha = particle.life / 20;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}