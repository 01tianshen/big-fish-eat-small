let canvas, ctx;
let player;
let fishSystem;
let gameLogic;
let mouseX = 0;
let mouseY = 0;
let isGameRunning = false;
let currentUser = null;
let gameStartTime = 0;
let eatEffect = { active: false, x: 0, y: 0, scale: 1 };
let useKeyboard = false;
let selectedMode = 'easy';
let currentRecordsPage = 1;
let totalRecordsPages = 1;

function initBubbles() {
  const bubblesContainer = document.querySelector('.bubbles');
  for (let i = 0; i < 15; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = Math.random() * 20 + 10;
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.animationDuration = (Math.random() * 8 + 4) + 's';
    bubble.style.animationDelay = Math.random() * 4 + 's';
    bubblesContainer.appendChild(bubble);
  }
}

function initCanvas() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (fishSystem) {
      fishSystem.canvasWidth = canvas.width;
      fishSystem.canvasHeight = canvas.height;
    }
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  canvas.addEventListener('mouseenter', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;
  let touchDeltaY = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    mouseX = touch.clientX;
    mouseY = touch.clientY;
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchDeltaX = touch.clientX - touchStartX;
    touchDeltaY = touch.clientY - touchStartY;
    
    if (player) {
      const speed = player.getSpeed();
      mouseX = touch.clientX;
      mouseY = touch.clientY;
    }
  });
  
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
  });
  
  window.addEventListener('keydown', (e) => {
    const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    const key = e.key.toLowerCase();
    
    if (e.key === 'Enter' && isTyping) {
      const loginForm = document.getElementById('loginForm');
      const registerForm = document.getElementById('registerForm');
      if (loginForm.style.display !== 'none') {
        handleLogin();
      } else if (registerForm.style.display !== 'none') {
        handleRegister();
      }
      e.preventDefault();
      return;
    }
    
    if (!isTyping && (key === 'w' || key === 'a' || key === 's' || key === 'd')) {
      useKeyboard = true;
      if (player) {
        player.setKey(key, true);
      }
      e.preventDefault();
    }
  });
  
  window.addEventListener('keyup', (e) => {
    const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
    const key = e.key.toLowerCase();
    if (!isTyping && (key === 'w' || key === 'a' || key === 's' || key === 'd')) {
      if (player) {
        player.setKey(key, false);
      }
      const activeKeys = ['w', 'a', 's', 'd'].filter(k => player && player.keys[k]);
      if (activeKeys.length === 0) {
        useKeyboard = false;
      }
      e.preventDefault();
    }
  });
}

function updateUI() {
  const expNeeded = GAME_CONFIG.getExpForLevel(player.level);
  const expPercent = (player.experience / expNeeded) * 100;
  
  document.querySelector('.level').textContent = `LV${player.level}`;
  document.querySelector('.score').textContent = Math.floor(player.score);
  document.querySelector('.exp-fill').style.width = expPercent + '%';
  document.querySelector('.exp-text').textContent = `${Math.floor(player.experience)}/${expNeeded}`;
  
  const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
  const minutes = Math.floor(gameTime / 60);
  const seconds = gameTime % 60;
  document.querySelector('.game-time').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const hearts = document.querySelectorAll('.heart');
  for (let i = 0; i < hearts.length; i++) {
    if (i < player.hearts) {
      hearts[i].textContent = '❤️';
      hearts[i].classList.remove('empty');
    } else {
      hearts[i].textContent = '🖤';
      hearts[i].classList.add('empty');
    }
  }
}

function gameLoop() {
  if (!isGameRunning) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  player.update(mouseX, mouseY, canvas.width, canvas.height, useKeyboard);
  fishSystem.update(player.x, player.y, player.size, player.level);
  gameLogic.update();
  
  fishSystem.draw(ctx);
  gameLogic.draw(ctx);
  player.draw(ctx);
  
  updateUI();
  
  if (gameLogic.isGameOver()) {
    showGameOver();
    return;
  }
  
  if (player.level >= GAME_CONFIG.MAX_LEVEL && player.experience >= GAME_CONFIG.getExpForLevel(player.level)) {
    showVictory();
    return;
  }
  
  requestAnimationFrame(gameLoop);
}

async function startGame() {
  if (!currentUser) {
    alert('请先登录！');
    return;
  }
  
  document.getElementById('startScreen').style.display = 'none';
  
  const savedData = await API.getPlayer(currentUser.id, selectedMode);
  
  player = new Player(canvas.width / 2, canvas.height / 2, selectedMode);
  
  if (savedData && savedData.success && savedData.level > 1) {
    player.level = savedData.level;
    player.experience = savedData.experience;
    player.score = savedData.score;
    player.size = savedData.size || GAME_CONFIG.getSizeForLevel(player.level);
    player.speed = GAME_CONFIG.getSpeedForLevel(player.level, true, selectedMode);
    player.hearts = Math.min(2 + (player.level - 1), 4);
  }
  
  fishSystem = new FishSystem(canvas.width, canvas.height, selectedMode);
  gameLogic = new GameLogic(player, fishSystem, selectedMode);
  
  gameStartTime = Date.now();
  isGameRunning = true;
  gameLoop();
}

function restartGame() {
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('victoryScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
  isGameRunning = false;
}

async function saveGame() {
  if (!player || !currentUser) return;
  
  await API.savePlayer({
    userId: currentUser.id,
    mode: selectedMode,
    level: player.level,
    experience: player.experience,
    score: player.score,
    size: player.size
  });
  
  alert('游戏已保存！');
}

async function showGameOver() {
  isGameRunning = false;
  
  const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
  
  await API.savePlayer({
    userId: currentUser.id,
    mode: selectedMode,
    level: 1,
    experience: 0,
    score: player.score,
    size: GAME_CONFIG.getSizeForLevel(1)
  });
  
  await API.saveGameRecord({
    userId: currentUser.id,
    mode: selectedMode,
    level: player.level,
    score: player.score,
    timeSeconds: gameTime
  });
  
  document.getElementById('finalLevel').textContent = `LV${player.level}`;
  document.getElementById('finalScore').textContent = Math.floor(player.score);
  document.getElementById('finalTime').textContent = formatTime(gameTime);
  document.getElementById('gameOverScreen').style.display = 'flex';
}

async function showVictory() {
  isGameRunning = false;
  
  const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
  
  await API.savePlayer({
    userId: currentUser.id,
    mode: selectedMode,
    level: 1,
    experience: 0,
    score: player.score,
    size: GAME_CONFIG.getSizeForLevel(1)
  });
  
  await API.saveGameRecord({
    userId: currentUser.id,
    mode: selectedMode,
    level: player.level,
    score: player.score,
    timeSeconds: gameTime
  });
  
  document.getElementById('victoryLevel').textContent = `LV${player.level}`;
  document.getElementById('victoryScore').textContent = Math.floor(player.score);
  document.getElementById('victoryTime').textContent = formatTime(gameTime);
  document.getElementById('victoryScreen').style.display = 'flex';
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function selectMode(mode) {
  selectedMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === mode) {
      btn.classList.add('active');
    }
  });
}

async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  const result = await API.login(username, password);
  
  if (result.success) {
    currentUser = result.user;
    
    const userInfo = await API.getUserInfo(currentUser.id);
    if (userInfo.success) {
      const serverLastLevel = userInfo.last_level || 1;
      const newLevel = userInfo.level || 1;
      
      currentUser.level = newLevel;
      currentUser.total_score = userInfo.total_score;
      currentUser.title = userInfo.title;
      
      if (newLevel > serverLastLevel && !currentUser.is_admin) {
        setTimeout(() => {
          showBlessingChoicePopup(newLevel, serverLastLevel);
        }, 500);
      } else if (newLevel < serverLastLevel && !currentUser.is_admin) {
        setTimeout(() => {
          showPunishmentNotification(newLevel, serverLastLevel);
        }, 500);
      }
    }
    
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    if (currentUser.is_admin) {
      document.getElementById('currentUser').textContent = `欢迎, 海神 (LV${currentUser.level || 100})`;
    } else {
      const title = currentUser.title ? ` [${currentUser.title}]` : ` (${getLevelTitle(currentUser.level || 1)})`;
      document.getElementById('currentUser').textContent = `欢迎, ${currentUser.username} (LV${currentUser.level || 1})${title}`;
    }
    
    if (currentUser.is_admin) {
      document.getElementById('adminPanelBtn').style.display = 'block';
    }
    
    if (currentUser.level >= 90 && !currentUser.is_admin && !currentUser.title) {
      setTimeout(() => {
        showTitlePopup();
      }, 1000);
    }
  } else {
    alert(result.message);
  }
}

async function handleRegister() {
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const email = document.getElementById('registerEmail').value.trim();
  
  if (password !== confirmPassword) {
    alert('两次输入的密码不一致！');
    return;
  }
  
  const result = await API.register(username, password, email);
  
  if (result.success) {
    alert('注册成功，请登录！');
    showLoginForm();
  } else {
    alert(result.message);
  }
}

function showRegisterForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

function showLoginForm() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
}

function logout() {
  currentUser = null;
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameOverScreen').style.display = 'none';
  document.getElementById('victoryScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('userRecordsPanel').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('adminPanelBtn').style.display = 'none';
}

async function loadAdminPanel() {
  if (!currentUser || !currentUser.is_admin) return;
  
  const users = await API.getAdminUsers(currentUser.id);
  const records = await API.getAllRecords(currentUser.id);
  const stats = await API.getStatistics(currentUser.id);
  
  const usersTable = document.getElementById('usersTable');
  const recordsTable = document.getElementById('recordsTable');
  const statsDiv = document.getElementById('adminStats');
  
  statsDiv.innerHTML = `
    <div>总用户数: ${stats.success ? stats.statistics.total_users : 0}</div>
    <div>总游戏记录: ${stats.success ? stats.statistics.total_records : 0}</div>
    <div>最高等级: ${stats.success ? stats.statistics.max_level : 0}</div>
    <div>平均分数: ${stats.success ? stats.statistics.avg_score : 0}</div>
  `;
  
  usersTable.innerHTML = `
    <tr><th>ID</th><th>用户名</th><th>等级</th><th>称号</th><th>邮箱</th><th>是否管理员</th><th>注册时间</th><th>操作</th></tr>
    ${users.success ? users.users.map(u => `
      <tr>
        <td>${u.id}</td>
        <td>${u.is_admin ? '海神' : u.username}</td>
        <td>LV${u.level} (${u.is_admin ? '海神' : u.title_name})</td>
        <td>${u.is_admin ? '海神' : (u.title || '-')}</td>
        <td>${u.email || '-'}</td>
        <td>${u.is_admin ? '是' : '否'}</td>
        <td>${u.created_at}</td>
        <td>
          ${u.is_admin ? '-' : `
            <button class="blessing-btn" onclick="showBlessing(${u.id}, '${u.username}', ${u.level})">海神赐福</button>
            <button class="punishment-btn" onclick="showPunishment(${u.id}, '${u.username}', ${u.level})">⚡神罚</button>
          `}
          <button class="delete-btn" onclick="deleteUser(${u.id})">删除</button>
        </td>
      </tr>
    `).join('') : ''}
  `;
  
  recordsTable.innerHTML = `
    <tr><th>记录ID</th><th>用户ID</th><th>用户名</th><th>模式</th><th>等级</th><th>分数</th><th>时间</th><th>操作</th></tr>
    ${records.success ? records.records.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.user_id}</td>
        <td>${r.username || '-'}</td>
        <td>${r.mode === 'easy' ? '简单' : r.mode === 'normal' ? '正常' : '困难'}</td>
        <td>LV${r.level}</td>
        <td>${r.score}</td>
        <td>${formatTime(r.time_seconds)}</td>
        <td><button onclick="deleteRecord(${r.id})">删除</button></td>
      </tr>
    `).join('') : ''}
  `;
  
  document.getElementById('adminPanel').style.display = 'block';
}

async function deleteUser(userId) {
  if (confirm('确定要删除该用户吗？')) {
    const result = await API.deleteUser(currentUser.id, userId);
    if (result.success) {
      alert('删除成功');
      loadAdminPanel();
    } else {
      alert(result.message);
    }
  }
}

async function deleteRecord(recordId) {
  if (confirm('确定要删除该记录吗？')) {
    const result = await API.deleteRecord(currentUser.id, recordId);
    if (result.success) {
      alert('删除成功');
      loadAdminPanel();
    } else {
      alert(result.message);
    }
  }
}

function closeAdminPanel() {
  document.getElementById('adminPanel').style.display = 'none';
}

async function loadUserRecords(page = 1) {
  if (!currentUser) return;
  
  currentRecordsPage = page;
  const records = await API.getUserRecords(currentUser.id, page);
  
  if (records.success) {
    totalRecordsPages = records.totalPages || 1;
  }
  
  const allRecordsForStats = await API.getUserRecords(currentUser.id, 1, 1000);
  const totalGames = allRecordsForStats.success ? allRecordsForStats.total : 0;
  const allRecords = allRecordsForStats.success ? allRecordsForStats.records : [];
  const maxLevel = allRecords.length > 0 ? Math.max(...allRecords.map(r => r.level), 0) : 0;
  const maxScore = allRecords.length > 0 ? Math.max(...allRecords.map(r => r.score), 0) : 0;
  
  const completedGames = allRecords.filter(r => r.level >= 7);
  const bestTime = completedGames.length > 0 
    ? formatTime(Math.min(...completedGames.map(r => r.time_seconds))) 
    : '-';
  
  const userLevel = records.success ? records.level || 1 : 1;
  const userTitle = records.success ? records.title : '';
  const levelTitle = getLevelTitle(userLevel);
  
  document.getElementById('totalGames').textContent = totalGames;
  document.getElementById('maxLevel').textContent = maxLevel > 0 ? `LV${maxLevel}` : '-';
  document.getElementById('maxScore').textContent = maxScore;
  document.getElementById('bestTime').textContent = bestTime;
  document.getElementById('userLevelDisplay').textContent = `玩家等级: LV${userLevel} (${levelTitle})${userTitle ? ` [${userTitle}]` : ''}`;
  
  const recordsTable = document.getElementById('userRecordsTable');
  recordsTable.innerHTML = `
    <tr><th>日期</th><th>模式</th><th>等级</th><th>分数</th><th>用时</th></tr>
    ${records.success && records.records.length > 0 ? records.records.map(r => {
      const date = new Date(r.created_at);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const recordLevelTitle = getLevelTitle(r.level);
      return `
        <tr>
          <td>${dateStr}</td>
          <td>${r.mode === 'easy' ? '简单' : r.mode === 'normal' ? '正常' : '困难'}</td>
          <td>LV${r.level} (${recordLevelTitle})</td>
          <td>${r.score}</td>
          <td>${formatTime(r.time_seconds)}</td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5">暂无游戏记录</td></tr>'}
  `;
  
  updateRecordsPagination();
  document.getElementById('userRecordsPanel').style.display = 'block';
}

function updateRecordsPagination() {
  const paginationDiv = document.getElementById('recordsPagination');
  if (!paginationDiv) return;
  
  paginationDiv.innerHTML = `
    <button class="pagination-btn" onclick="prevRecordsPage()" ${currentRecordsPage <= 1 ? 'disabled' : ''}>上一页</button>
    <span class="pagination-info">${currentRecordsPage}/${totalRecordsPages}</span>
    <button class="pagination-btn" onclick="nextRecordsPage()" ${currentRecordsPage >= totalRecordsPages ? 'disabled' : ''}>下一页</button>
  `;
}

async function prevRecordsPage() {
  if (currentRecordsPage > 1) {
    await loadUserRecords(currentRecordsPage - 1);
  }
}

async function nextRecordsPage() {
  if (currentRecordsPage < totalRecordsPages) {
    await loadUserRecords(currentRecordsPage + 1);
  }
}

function closeUserRecords() {
  document.getElementById('userRecordsPanel').style.display = 'none';
}

async function loadRanking() {
  document.querySelectorAll('.ranking-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector('.ranking-tab.human').classList.add('active');
  await loadRankingByMode('easy');
  document.getElementById('rankingPanel').style.display = 'block';
}

function closeRanking() {
  document.getElementById('rankingPanel').style.display = 'none';
}

async function loadRankingByMode(mode) {
  document.querySelectorAll('.ranking-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelector(`.ranking-tab[data-mode="${mode}"]`).classList.add('active');
  
  const rankingList = document.getElementById('rankingList');
  rankingList.innerHTML = '<div class="ranking-loading">加载中...</div>';
  
  const result = await API.getRank(mode);
  
  if (!result.success || !result.rankings || result.rankings.length === 0) {
    rankingList.innerHTML = '<div class="ranking-empty">暂无记录</div>';
    return;
  }
  
  const rankings = result.rankings;
  let html = '';
  
  rankings.forEach((item, index) => {
    const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'other';
    const title = item.title ? `<span class="rank-title">[${item.title}]</span>` : '';
    const adminBadge = item.is_admin ? '<span class="admin-badge">⚡</span>' : '';
    const levelTitle = getLevelTitle(item.user_level);
    html += `
      <div class="ranking-item rank-${index + 1}">
        <div class="rank-position ${rankClass}">${item.rank}</div>
        <div class="rank-username">${adminBadge}${item.username}${title}</div>
        <div class="rank-level">LV${item.user_level} (${levelTitle})</div>
        <div class="rank-score">${item.score} 分</div>
      </div>
    `;
  });
  
  rankingList.innerHTML = html;
}

function showTitlePopup() {
  document.getElementById('titlePopup').style.display = 'flex';
  document.getElementById('titleInput').value = '';
  
  const usedTitlesDiv = document.getElementById('usedTitles');
  if (usedTitlesDiv) {
    const result = await API.getAllTitles();
    if (result.success && result.titles.length > 0) {
      usedTitlesDiv.innerHTML = `<div style="margin-top: 15px; color: #ffaaaa; font-size: 12px;">已被使用的称号: ${result.titles.join('、')}</div>`;
    } else {
      usedTitlesDiv.innerHTML = '<div style="margin-top: 15px; color: #87ceeb; font-size: 12px;">暂无已被使用的称号</div>';
    }
  }
}

function closeTitlePopup() {
  document.getElementById('titlePopup').style.display = 'none';
}

async function saveTitle() {
  const title = document.getElementById('titleInput').value.trim();
  
  if (!title) {
    alert('请输入称号！');
    return;
  }
  
  const result = await API.updateUserTitle(currentUser.id, title);
  
  if (result.success) {
    currentUser.title = result.title;
    alert(`称号设置成功！你的称号是：${result.title}`);
    closeTitlePopup();
  } else {
    alert(result.message);
  }
}

let blessingTargetUserId = null;
let blessingTargetUsername = null;
let blessingLevel = null;

function showBlessing(userId, username, currentLevel) {
  blessingTargetUserId = userId;
  blessingTargetUsername = username;
  blessingLevel = currentLevel + 10;
  document.getElementById('customLevel').value = blessingLevel;
  document.getElementById('blessingPopup').style.display = 'flex';
}

function closeBlessingPopup() {
  document.getElementById('blessingPopup').style.display = 'none';
  blessingTargetUserId = null;
  blessingTargetUsername = null;
  blessingLevel = null;
}

function setBlessingLevel(level) {
  blessingLevel = level;
  document.getElementById('customLevel').value = level;
}

async function applyBlessing() {
  const level = document.getElementById('customLevel').value;
  const numLevel = parseInt(level);
  
  if (!numLevel || numLevel < 1 || numLevel > 100) {
    alert('请输入有效的等级（1-100）');
    return;
  }
  
  const result = await API.blessing(currentUser.id, blessingTargetUserId, numLevel);
  
  if (result.success) {
    alert(result.message);
    closeBlessingPopup();
    loadAdminPanel();
  } else {
    alert(result.message);
  }
}

function showBlessingNotification(message) {
  document.getElementById('blessingMessage').textContent = message;
  document.getElementById('blessingNotification').style.display = 'flex';
}

function closeBlessingNotification() {
  document.getElementById('blessingNotification').style.display = 'none';
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

let blessingNewLevel = 0;
let blessingOldLevel = 0;

function showBlessingChoicePopup(newLevel, oldLevel) {
  blessingNewLevel = newLevel;
  blessingOldLevel = oldLevel;
  document.getElementById('blessingChoiceMessage').textContent = 
    `海神赐予您祝福，等级将从 LV${oldLevel} 提升至 LV${newLevel}！`;
  document.getElementById('blessingTitleHint').textContent = getLevelTitle(newLevel);
  document.getElementById('blessingChoicePopup').style.display = 'flex';
}

async function acceptBlessing() {
  const result = await API.updateUserLastLevel(currentUser.id, blessingNewLevel);
  document.getElementById('blessingChoicePopup').style.display = 'none';
  alert(`恭喜！您接受了海神赐福，等级提升至 LV${blessingNewLevel}！称号：${getLevelTitle(blessingNewLevel)}`);
}

function rejectBlessing() {
  document.getElementById('blessingChoicePopup').style.display = 'none';
  alert('您暂时拒绝了海神赐福，下次登录时可以再次选择。');
}

function showPunishmentNotification(newLevel, oldLevel) {
  document.getElementById('punishmentMessage').textContent = 
    `⚡ 您受到神罚，等级从 LV${oldLevel} 降至 LV${newLevel}！`;
  document.getElementById('punishmentNotification').style.display = 'flex';
}

function closePunishmentNotification() {
  document.getElementById('punishmentNotification').style.display = 'none';
}

let punishmentTargetUserId = null;
let punishmentLevel = null;

function showPunishment(userId, username, currentLevel) {
  punishmentTargetUserId = userId;
  punishmentLevel = Math.max(1, currentLevel - 10);
  document.getElementById('customPunishmentLevel').value = punishmentLevel;
  document.getElementById('punishmentPopup').style.display = 'flex';
}

function closePunishmentPopup() {
  document.getElementById('punishmentPopup').style.display = 'none';
  punishmentTargetUserId = null;
  punishmentLevel = null;
}

function setPunishmentLevel(level) {
  punishmentLevel = level;
  document.getElementById('customPunishmentLevel').value = level;
}

async function applyPunishment() {
  const level = document.getElementById('customPunishmentLevel').value;
  const numLevel = parseInt(level);
  
  if (!numLevel || numLevel < 1 || numLevel > 100) {
    alert('请输入有效的等级（1-100）');
    return;
  }
  
  const result = await API.punishment(currentUser.id, punishmentTargetUserId, numLevel);
  
  if (result.success) {
    alert(result.message);
    closePunishmentPopup();
    loadAdminPanel();
  } else {
    alert(result.message);
  }
}

window.addEventListener('load', () => {
  initBubbles();
  initCanvas();
});

window.startGame = startGame;
window.restartGame = restartGame;
window.saveGame = saveGame;
window.selectMode = selectMode;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.logout = logout;
window.loadAdminPanel = loadAdminPanel;
window.deleteUser = deleteUser;
window.deleteRecord = deleteRecord;
window.closeAdminPanel = closeAdminPanel;
window.loadUserRecords = loadUserRecords;
window.closeUserRecords = closeUserRecords;
window.loadRanking = loadRanking;
window.closeRanking = closeRanking;
window.loadRankingByMode = loadRankingByMode;
window.showTitlePopup = showTitlePopup;
window.closeTitlePopup = closeTitlePopup;
window.saveTitle = saveTitle;
window.showBlessing = showBlessing;
window.closeBlessingPopup = closeBlessingPopup;
window.setBlessingLevel = setBlessingLevel;
window.applyBlessing = applyBlessing;
window.closeBlessingNotification = closeBlessingNotification;
window.showPunishment = showPunishment;
window.closePunishmentPopup = closePunishmentPopup;
window.setPunishmentLevel = setPunishmentLevel;
window.applyPunishment = applyPunishment;
window.closePunishmentNotification = closePunishmentNotification;
window.acceptBlessing = acceptBlessing;
window.rejectBlessing = rejectBlessing;