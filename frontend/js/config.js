const GAME_CONFIG = {
  MAX_LEVEL: 7,
  BASE_EXPERIENCE: 30,
  BASE_SIZE: 20,
  SIZE_PER_LEVEL: 10,
  
  FISH_TYPES: {
    clownfish: { name: '小丑鱼', color: '#ff6b6b', emoji: '🐠' },
    lionfish: { name: '狮子鱼', color: '#ffa502', emoji: '🐟' },
    shark: { name: '鲨鱼', color: '#8b7355', emoji: '🦈' }
  },
  
  LEVEL_CONFIG: [
    { level: 1, type: 'clownfish', size: 'small', expToNext: 30 },
    { level: 2, type: 'clownfish', size: 'medium', expToNext: 90 },
    { level: 3, type: 'clownfish', size: 'large', expToNext: 270 },
    { level: 4, type: 'lionfish', size: 'small', expToNext: 810 },
    { level: 5, type: 'lionfish', size: 'medium', expToNext: 2430 },
    { level: 6, type: 'lionfish', size: 'large', expToNext: 7290 },
    { level: 7, type: 'shark', size: 'small', expToNext: 21870 }
  ],
  
  getExpForLevel: function(level) {
    return Math.pow(3, level - 1) * this.BASE_EXPERIENCE;
  },
  
  getSizeForLevel: function(level) {
    return this.BASE_SIZE + (level - 1) * this.SIZE_PER_LEVEL;
  },
  
  getSpeedForLevel: function(level, isPlayer = false, mode = 'easy') {
    const baseSpeed = Math.max(0.25, (8 - level) * 0.25);
    const playerSpeed = isPlayer ? baseSpeed * 1.3 : baseSpeed;
    
    if (!isPlayer && mode === 'hard') {
      if (level > 3) {
        return playerSpeed * 0.9;
      }
    }
    
    return playerSpeed;
  }
};