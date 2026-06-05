const express = require('express');
const router = express.Router();

router.post('/add', (req, res) => {
  const { userId, friendUsername } = req.body;
  const users = db.users.all();
  const friend = users.find(u => u.username === friendUsername);
  
  if (!friend) {
    return res.json({ success: false, message: '用户不存在' });
  }
  
  if (friend.id === userId) {
    return res.json({ success: false, message: '不能添加自己为好友' });
  }
  
  const friends = db.friends.all();
  const existing = friends.find(f => 
    (f.user_id === userId && f.friend_id === friend.id) ||
    (f.user_id === friend.id && f.friend_id === userId)
  );
  
  if (existing) {
    if (existing.status === 'accepted') {
      return res.json({ success: false, message: '已经是好友' });
    } else if (existing.user_id === userId) {
      return res.json({ success: false, message: '已发送好友请求' });
    } else {
      return res.json({ success: false, message: '对方已向你发送好友请求，请先处理' });
    }
  }
  
  db.friends.run('INSERT INTO friends', [userId, friend.id, 'pending']);
  res.json({ success: true, message: '好友请求已发送' });
});

router.get('/list', (req, res) => {
  const { userId } = req.query;
  const users = db.users.all();
  const friends = db.friends.all();
  
  const friendList = friends.filter(f => 
    f.user_id === parseInt(userId) || f.friend_id === parseInt(userId)
  ).filter(f => f.status === 'accepted').map(f => {
    const friendId = f.user_id === parseInt(userId) ? f.friend_id : f.user_id;
    return users.find(u => u.id === friendId);
  }).filter(u => u);
  
  res.json({ success: true, friends: friendList });
});

router.get('/requests', (req, res) => {
  const { userId } = req.query;
  const users = db.users.all();
  const friends = db.friends.all();
  
  const requests = friends.filter(f => 
    f.friend_id === parseInt(userId) && f.status === 'pending'
  ).map(f => {
    const user = users.find(u => u.id === f.user_id);
    return { ...user, requestId: f.id };
  }).filter(u => u);
  
  res.json({ success: true, requests });
});

router.post('/accept', (req, res) => {
  const { requestId } = req.body;
  db.friends.run('UPDATE friends', [requestId, 'accepted']);
  res.json({ success: true, message: '已接受好友请求' });
});

router.post('/reject', (req, res) => {
  const { requestId } = req.body;
  const friends = db.friends.all();
  const request = friends.find(f => f.id === requestId);
  if (request) {
    db.friends.run('DELETE FROM friends', [request.user_id, request.friend_id]);
  }
  res.json({ success: true, message: '已拒绝好友请求' });
});

router.post('/remove', (req, res) => {
  const { userId, friendId } = req.body;
  db.friends.run('DELETE FROM friends', [userId, friendId]);
  res.json({ success: true, message: '已删除好友' });
});

router.post('/message', (req, res) => {
  const { fromId, toId, content } = req.body;
  db.messages.run('INSERT INTO messages', [fromId, toId, content, 'text']);
  res.json({ success: true, message: '消息已发送' });
});

router.get('/messages', (req, res) => {
  const { userId, friendId } = req.query;
  const users = db.users.all();
  let messages = db.messages.all();
  
  messages = messages.filter(m => 
    (m.from_id === parseInt(userId) && m.to_id === parseInt(friendId)) ||
    (m.from_id === parseInt(friendId) && m.to_id === parseInt(userId))
  ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  db.messages.run('UPDATE messages', [parseInt(userId), parseInt(friendId)]);
  
  const friend = users.find(u => u.id === parseInt(friendId));
  
  res.json({ success: true, messages, friend });
});

router.post('/send-feed', (req, res) => {
  const { fromId, toId, feedType, amount } = req.body;
  const users = db.users.all();
  const fromUser = users.find(u => u.id === fromId);
  const toUser = users.find(u => u.id === toId);
  
  if (!fromUser || !toUser) {
    return res.json({ success: false, message: '用户不存在' });
  }
  
  const friends = db.friends.all();
  const isFriend = friends.some(f => 
    ((f.user_id === fromId && f.friend_id === toId) ||
     (f.user_id === toId && f.friend_id === fromId)) && f.status === 'accepted'
  );
  
  if (!isFriend) {
    return res.json({ success: false, message: '只能给好友发送饲料包' });
  }
  
  let feedField;
  if (feedType === 'shrimp') feedField = 'feed_shrimp';
  else if (feedType === 'squid') feedField = 'feed_squid';
  else if (feedType === 'crab') feedField = 'feed_crab';
  else return res.json({ success: false, message: '无效的饲料包类型' });
  
  if (fromUser[feedField] < amount) {
    return res.json({ success: false, message: '饲料包不足' });
  }
  
  fromUser[feedField] -= amount;
  toUser[feedField] += amount;
  
  const fs = require('fs');
  const path = require('path');
  const usersFile = path.join(__dirname, '../database/users.json');
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  
  db.messages.run('INSERT INTO messages', [fromId, toId, `送给你 ${amount} 个饲料包`, 'feed']);
  
  res.json({ success: true, message: '饲料包已赠送' });
});

module.exports = router;