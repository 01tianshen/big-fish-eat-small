function calculateLevel(score) {
  if (score < 0) return 1;
  return Math.min(100, Math.floor(score / 10000) + 1);
}

function updateUserScore(userId, score) {
  const users = db.users.all();
  const user = users.find(u => u.id === userId);
  
  if (user) {
    const newTotalScore = (user.total_score || 0) + score;
    const newLevel = calculateLevel(newTotalScore);
    
    db.users.run('UPDATE users SET total_score = ?, level = ? WHERE id = ?', [newTotalScore, newLevel, userId]);
    
    return { total_score: newTotalScore, level: newLevel };
  }
  
  return null;
}

exports.getPlayer = (req, res) => {
  const userId = parseInt(req.params.userId);
  const { mode } = req.query;
  
  const row = db.progress.get('SELECT * FROM player_progress WHERE user_id = ? AND mode = ?', [userId, mode]);
  
  if (row) {
    res.json({ 
      success: true,
      user_id: row.user_id,
      mode: row.mode,
      level: row.level,
      experience: row.experience,
      score: row.score,
      size: 20 + (row.level - 1) * 10
    });
  } else {
    res.json({ 
      success: true,
      user_id: userId,
      mode,
      level: 1,
      experience: 0,
      score: 0,
      size: 20
    });
  }
};

exports.savePlayer = (req, res) => {
  const { userId, mode, level, experience, score, size } = req.body;
  
  const row = db.progress.get('SELECT * FROM player_progress WHERE user_id = ? AND mode = ?', [userId, mode]);
  const oldScore = row ? row.score : 0;
  const scoreGain = Math.max(0, score - oldScore);
  
  if (row) {
    db.progress.run('UPDATE player_progress SET level = ?, experience = ?, score = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND mode = ?', 
      [level, experience, Math.max(row.score, score), userId, mode]);
  } else {
    db.progress.run('INSERT INTO player_progress (user_id, mode, level, experience, score) VALUES (?, ?, ?, ?, ?)', 
      [userId, mode, level, experience, score]);
  }
  
  if (scoreGain > 0) {
    updateUserScore(userId, scoreGain);
  }
  
  res.json({ success: true });
};

exports.saveGameRecord = (req, res) => {
  const { userId, mode, level, score, timeSeconds } = req.body;
  
  const result = db.records.run('INSERT INTO game_records (user_id, mode, level, score, time_seconds) VALUES (?, ?, ?, ?, ?)', 
    [userId, mode, level, score, timeSeconds]);
  
  updateUserScore(userId, score);
  
  res.json({ success: true, recordId: result.lastID });
};

exports.getUserRecords = (req, res) => {
  const userId = parseInt(req.params.userId);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const allRecords = db.records.all('SELECT * FROM game_records WHERE user_id = ?', [userId]);
  // 按时间倒序排列，最新的在前
  allRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  const user = db.users.get('SELECT * FROM users WHERE id = ?', [userId]);
  
  const total = allRecords.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const records = allRecords.slice(startIndex, endIndex);
  
  res.json({ 
    success: true,
    total_score: user ? user.total_score || 0 : 0,
    level: user ? user.level || 1 : 1,
    title: user ? user.title || '' : '',
    total: total,
    page: page,
    totalPages: totalPages,
    records: records.map(row => ({
      id: row.id,
      mode: row.mode,
      level: row.level,
      score: row.score,
      time_seconds: row.time_seconds,
      created_at: row.created_at
    }))
  });
};

exports.getRank = (req, res) => {
  const { mode } = req.query;
  const progress = db.progress.all();
  const users = db.users.all();
  
  let filteredProgress = progress;
  if (mode && ['easy', 'normal', 'hard'].includes(mode)) {
    filteredProgress = progress.filter(p => p.mode === mode);
  }
  
  const bestScores = {};
  
  filteredProgress.forEach(p => {
    const key = mode ? `${p.user_id}_${p.mode}` : p.user_id;
    if (!bestScores[key] || p.score > bestScores[key].score) {
      bestScores[key] = p;
    }
  });
  
  let rankings = Object.values(bestScores)
    .map(p => {
      const user = users.find(u => u.id === p.user_id);
      return {
        user_id: p.user_id,
        username: user ? user.username : '未知',
        score: p.score,
        level: p.level,
        mode: p.mode,
        user_level: user ? user.level || 1 : 1,
        title: user ? user.title || '' : '',
        is_admin: user ? user.is_admin || 0 : 0
      };
    })
    .sort((a, b) => {
      if (a.is_admin && !b.is_admin) return -1;
      if (!a.is_admin && b.is_admin) return 1;
      return b.score - a.score || b.level - a.level;
    })
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      ...item
    }));
  
  res.json({ success: true, rankings });
};

exports.updateUserTitle = (req, res) => {
  const { userId, title } = req.body;
  
  const user = db.users.get('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (!user) {
    return res.json({ success: false, message: '用户不存在' });
  }
  
  if (user.level < 90 && !user.is_admin) {
    return res.json({ success: false, message: '等级不足90级，无法设置称号' });
  }
  
  const trimmedTitle = title.trim().substring(0, 10);
  
  if (!trimmedTitle) {
    return res.json({ success: false, message: '称号不能为空' });
  }
  
  const users = db.users.all();
  const existingUser = users.find(u => u.title === trimmedTitle && u.id !== userId);
  
  if (existingUser) {
    return res.json({ success: false, message: '当前果位已被占据！' });
  }
  
  db.users.run('UPDATE users SET title = ? WHERE id = ?', [trimmedTitle, userId]);
  
  res.json({ success: true, title: trimmedTitle });
};

exports.getUserInfo = (req, res) => {
  const userId = parseInt(req.params.userId);
  
  const user = db.users.get('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (user) {
    res.json({
      success: true,
      id: user.id,
      username: user.username,
      total_score: user.total_score || 0,
      level: user.level || 1,
      last_level: user.last_level || 1,
      title: user.title || '',
      is_admin: user.is_admin || 0
    });
  } else {
    res.json({ success: false, message: '用户不存在' });
  }
};

exports.updateUserLastLevel = (req, res) => {
  const { userId, level } = req.body;
  
  const user = db.users.get('SELECT * FROM users WHERE id = ?', [userId]);
  
  if (!user) {
    return res.json({ success: false, message: '用户不存在' });
  }
  
  db.users.run('UPDATE users SET last_level = ? WHERE id = ?', [level, userId]);
  
  res.json({ success: true });
};

exports.getAllTitles = (req, res) => {
  const users = db.users.all();
  
  const allTitles = users
    .filter(u => u.title && u.title.trim() !== '')
    .map(u => u.title.trim());
  
  res.json({ success: true, titles: allTitles });
};
