const express = require('express');
const router = express.Router();

function isAdmin(req, res, next) {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(401).json({ success: false, message: '用户ID不能为空' });
  }
  
  const user = db.users.get('SELECT is_admin FROM users WHERE id = ?', [parseInt(userId)]);
  
  if (!user || user.is_admin !== 1) {
    return res.status(403).json({ success: false, message: '无管理员权限' });
  }
  next();
}

function getLevelTitle(level) {
  if (level >= 91) return '封号斗罗';
  if (level >= 81) return '鱼斗罗';
  if (level >= 71) return '鱼圣';
  if (level >= 61) return '鱼帝';
  if (level >= 51) return '鱼王';
  if (level >= 41) return '鱼宗';
  if (level >= 31) return '鱼尊';
  if (level >= 21) return '鱼师';
  if (level >= 11) return '鱼士';
  return '鱼卒';
}

router.get('/users', isAdmin, (req, res) => {
  const users = db.users.all();
  
  res.json({ 
    success: true, 
    users: users.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      is_admin: row.is_admin === 1,
      level: row.level || 1,
      total_score: row.total_score || 0,
      title: row.title || '',
      title_name: getLevelTitle(row.level || 1),
      feed_shrimp: row.feed_shrimp || 0,
      feed_squid: row.feed_squid || 0,
      feed_crab: row.feed_crab || 0,
      created_at: row.created_at
    }))
  });
});

router.delete('/user/:id', isAdmin, (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (userId === 1) {
    return res.status(400).json({ success: false, message: '不能删除默认管理员账户' });
  }
  
  const result = db.users.run('DELETE FROM users WHERE id = ?', [userId]);
  
  res.json({ success: true, message: '删除成功' });
});

router.post('/blessing', isAdmin, (req, res) => {
  const { userId, level } = req.body;
  
  if (!userId || !level) {
    return res.json({ success: false, message: '参数不能为空' });
  }
  
  const targetUser = db.users.get('SELECT * FROM users WHERE id = ?', [parseInt(userId)]);
  
  if (!targetUser) {
    return res.json({ success: false, message: '用户不存在' });
  }
  
  if (targetUser.is_admin) {
    return res.json({ success: false, message: '不能给管理员赐福' });
  }
  
  const newLevel = Math.min(100, Math.max(1, parseInt(level)));
  const newScore = (newLevel - 1) * 10000;
  
  db.users.run('UPDATE users SET total_score = ?, level = ? WHERE id = ?', [newScore, newLevel, parseInt(userId)]);
  
  const titleName = getLevelTitle(newLevel);
  
  res.json({ 
    success: true, 
    message: `海神赐福成功！${targetUser.username} 的等级已提升至 LV${newLevel}`,
    level: newLevel,
    title_name: titleName
  });
});

router.post('/punishment', isAdmin, (req, res) => {
  const { userId, level } = req.body;
  
  if (!userId || !level) {
    return res.json({ success: false, message: '参数不能为空' });
  }
  
  const targetUser = db.users.get('SELECT * FROM users WHERE id = ?', [parseInt(userId)]);
  
  if (!targetUser) {
    return res.json({ success: false, message: '用户不存在' });
  }
  
  if (targetUser.is_admin) {
    return res.json({ success: false, message: '不能对管理员实施神罚' });
  }
  
  const newLevel = Math.min(100, Math.max(1, parseInt(level)));
  const newScore = (newLevel - 1) * 10000;
  
  db.users.run('UPDATE users SET total_score = ?, level = ?, title = ? WHERE id = ?', [newScore, newLevel, '', parseInt(userId)]);
  
  const titleName = getLevelTitle(newLevel);
  
  res.json({ 
    success: true, 
    message: `神罚降临！${targetUser.username} 的等级已降至 LV${newLevel}`,
    level: newLevel,
    title_name: titleName
  });
});

router.get('/records', isAdmin, (req, res) => {
  const { userId, all } = req.query;
  const users = db.users.all();
  
  let records = db.records.all();
  
  if (!all && userId) {
    records = records.filter(r => r.user_id === parseInt(userId));
  }
  
  records = records.map(r => {
    const user = users.find(u => u.id === r.user_id);
    return {
      id: r.id,
      user_id: r.user_id,
      username: user ? user.username : '-',
      mode: r.mode,
      level: r.level,
      score: r.score,
      time_seconds: r.time_seconds,
      created_at: r.created_at
    };
  });
  
  records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.json({ success: true, records });
});

router.delete('/record/:id', isAdmin, (req, res) => {
  const recordId = parseInt(req.params.id);
  
  db.records.run('DELETE FROM game_records WHERE id = ?', [recordId]);
  
  res.json({ success: true, message: '删除成功' });
});

router.get('/statistics', isAdmin, (req, res) => {
  const users = db.users.all();
  const records = db.records.all();
  
  const stats = {
    total_users: users.length,
    total_records: records.length,
    max_level: records.length > 0 ? Math.max(...records.map(r => r.level)) : 0,
    avg_score: records.length > 0 ? Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length) : 0
  };
  
  res.json({ success: true, statistics: stats });
});

router.post('/blessing-feed', isAdmin, (req, res) => {
  const { userId, feedType, amount } = req.body;
  
  if (!userId || !feedType || !amount) {
    return res.json({ success: false, message: '参数不能为空' });
  }
  
  const targetUser = db.users.get('SELECT * FROM users WHERE id = ?', [parseInt(userId)]);
  
  if (!targetUser) {
    return res.json({ success: false, message: '用户不存在' });
  }
  
  const feedNames = {
    shrimp: '浅滩磷虾包',
    squid: '远洋鱿粒包',
    crab: '深海鳌鲜包'
  };
  
  if (!feedNames[feedType]) {
    return res.json({ success: false, message: '无效的饲料包类型' });
  }
  
  const users = db.users.all();
  const index = users.findIndex(u => u.id === parseInt(userId));
  if (index !== -1) {
    const feedField = `feed_${feedType}`;
    users[index][feedField] = (users[index][feedField] || 0) + parseInt(amount);
    
    const fs = require('fs');
    const path = require('path');
    const usersFile = path.join(__dirname, '../database/users.json');
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    
    res.json({ 
      success: true, 
      message: `海神赐福！${targetUser.username} 获得 ${amount} 个${feedNames[feedType]}`
    });
  } else {
    res.json({ success: false, message: '用户不存在' });
  }
});

router.post('/punishment-feed', isAdmin, (req, res) => {
  const { userId, feedType, amount } = req.body;
  
  if (!userId || !feedType || !amount) {
    return res.json({ success: false, message: '参数不能为空' });
  }
  
  const targetUser = db.users.get('SELECT * FROM users WHERE id = ?', [parseInt(userId)]);
  
  if (!targetUser) {
    return res.json({ success: false, message: '用户不存在' });
  }
  
  if (targetUser.is_admin) {
    return res.json({ success: false, message: '不能对管理员实施神罚' });
  }
  
  const feedNames = {
    shrimp: '浅滩磷虾包',
    squid: '远洋鱿粒包',
    crab: '深海鳌鲜包'
  };
  
  if (!feedNames[feedType]) {
    return res.json({ success: false, message: '无效的饲料包类型' });
  }
  
  const feedField = `feed_${feedType}`;
  if ((targetUser[feedField] || 0) < parseInt(amount)) {
    return res.json({ success: false, message: '扣除的饲料包数量超过用户拥有量' });
  }
  
  const users = db.users.all();
  const index = users.findIndex(u => u.id === parseInt(userId));
  if (index !== -1) {
    users[index][feedField] = Math.max(0, (users[index][feedField] || 0) - parseInt(amount));
    
    const fs = require('fs');
    const path = require('path');
    const usersFile = path.join(__dirname, '../database/users.json');
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    
    res.json({ 
      success: true, 
      message: `神罚降临！${targetUser.username} 被扣除 ${amount} 个${feedNames[feedType]}`
    });
  } else {
    res.json({ success: false, message: '用户不存在' });
  }
});

module.exports = router;
