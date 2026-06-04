const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  
  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({ success: false, message: '用户名至少3个字符，密码至少6个字符' });
  }
  
  const existingUser = db.users.get('SELECT id FROM users WHERE username = ?', [username]);
  
  if (existingUser) {
    return res.status(400).json({ success: false, message: '用户名已存在' });
  }
  
  const result = db.users.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email || null]);
  
  res.json({ 
    success: true, 
    message: '注册成功',
    user: { id: result.lastID, username, email }
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  
  const user = db.users.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
  
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
  
  res.json({ 
    success: true, 
    message: '登录成功',
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      is_admin: user.is_admin === 1
    }
  });
});

router.get('/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  const user = db.users.get('SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?', [userId]);
  
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  
  res.json({ 
    success: true, 
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      is_admin: user.is_admin === 1,
      created_at: user.created_at
    }
  });
});

module.exports = router;