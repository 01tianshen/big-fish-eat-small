const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const playerRoutes = require('./routes/player');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const dbDir = path.join(__dirname, 'database');
const usersFile = path.join(dbDir, 'users.json');
const recordsFile = path.join(dbDir, 'records.json');
const progressFile = path.join(dbDir, 'progress.json');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function initDatabase() {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([
      { id: 1, username: 'admin', password: 'admin123', email: null, is_admin: 1, total_score: 999999, level: 100, last_level: 100, title: '海神', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ], null, 2));
    console.log('已创建默认管理员账户: admin/admin123');
  } else {
    // 迁移现有用户数据，补充缺失字段
    let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    let needUpdate = false;
    users = users.map(u => {
      if (!('last_level' in u) || u.last_level === undefined) {
        u.last_level = u.level || 1;
        needUpdate = true;
      }
      if (!('total_score' in u) || u.total_score === undefined) {
        u.total_score = 0;
        needUpdate = true;
      }
      if (!('level' in u) || u.level === undefined) {
        u.level = 1;
        needUpdate = true;
      }
      if (!('title' in u) || u.title === undefined) {
        u.title = '';
        needUpdate = true;
      }
      return u;
    });
    if (needUpdate) {
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      console.log('已更新用户数据结构');
    }
  }
  
  if (!fs.existsSync(recordsFile)) {
    fs.writeFileSync(recordsFile, JSON.stringify([], null, 2));
  }
  
  if (!fs.existsSync(progressFile)) {
    fs.writeFileSync(progressFile, JSON.stringify([], null, 2));
  }
}

initDatabase();

global.db = {
  users: {
    get: (query, params) => {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      if (query.includes('username = ? AND password = ?')) {
        return users.find(u => u.username === params[0] && u.password === params[1]);
      }
      if (query.includes('username = ?')) {
        return users.find(u => u.username === params[0]);
      }
      if (query.includes('id = ?')) {
        return users.find(u => u.id === params[0]);
      }
      if (query.includes('COUNT(*)')) {
        return { count: users.length };
      }
      return users;
    },
    run: (query, params) => {
      let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      if (query.includes('INSERT INTO users')) {
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({
          id: newId,
          username: params[0],
          password: params[1],
          email: params[2],
          is_admin: 0,
          total_score: 0,
          level: 1,
          last_level: 1,
          title: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        return { lastID: newId };
      }
      if (query.includes('DELETE FROM users')) {
        users = users.filter(u => u.id !== params[0]);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        return { changes: users.length };
      }
      if (query.includes('UPDATE users')) {
        let userId = params[params.length - 1];
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
          // 根据查询类型分别处理
          if (query.includes('total_score = ?') && query.includes('level = ?')) {
            // 赐福/神罚时同时更新total_score和level
            users[index].total_score = params[0];
            users[index].level = params[1];
            users[index].last_level = params[1]; // 同时更新last_level
            // 神罚时清除称号
            if (query.includes('title = ?')) {
              users[index].title = '';
            }
          } else if (query.includes('title = ?')) {
            // 只更新称号
            users[index].title = params[0];
          } else if (query.includes('last_level = ?')) {
            // 只更新last_level（玩家接受赐福时）
            users[index].last_level = params[0];
          }
          users[index].updated_at = new Date().toISOString();
          fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        }
        return { changes: 1 };
      }
    },
    all: () => JSON.parse(fs.readFileSync(usersFile, 'utf8'))
  },
  records: {
    all: (query, params) => {
      const records = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
      if (params && params.length > 0) {
        return records.filter(r => r.user_id === params[0]);
      }
      return records;
    },
    run: (query, params) => {
      let records = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
      if (query.includes('INSERT INTO game_records')) {
        const newId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
        records.push({
          id: newId,
          user_id: params[0],
          mode: params[1],
          level: params[2],
          score: params[3],
          time_seconds: params[4],
          created_at: new Date().toISOString()
        });
        fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2));
        return { lastID: newId };
      }
      if (query.includes('DELETE FROM game_records')) {
        records = records.filter(r => r.id !== params[0]);
        fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2));
        return { changes: records.length };
      }
    }
  },
  progress: {
    get: (query, params) => {
      const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
      if (params && params.length === 2) {
        return progress.find(p => p.user_id === params[0] && p.mode === params[1]);
      }
      return progress;
    },
    run: (query, params) => {
      let progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
      if (query.includes('INSERT INTO player_progress')) {
        const newId = progress.length > 0 ? Math.max(...p => p.id) + 1 : 1;
        progress.push({
          id: newId,
          user_id: params[0],
          mode: params[1],
          level: params[2] || 1,
          experience: params[3] || 0,
          score: params[4] || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
        return { lastID: newId };
      }
      if (query.includes('UPDATE player_progress')) {
        const index = progress.findIndex(p => p.user_id === params[3] && p.mode === params[4]);
        if (index !== -1) {
          progress[index].level = params[0];
          progress[index].experience = params[1];
          progress[index].score = params[2];
          progress[index].updated_at = new Date().toISOString();
          fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
        }
        return { changes: 1 };
      }
    },
    all: (query) => {
      const progress = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
      return progress;
    }
  }
};

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', playerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});