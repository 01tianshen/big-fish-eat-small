const API_BASE_URL = 'https://big-fish-eat-small-production.up.railway.app/api';

const API = {
  async register(username, password, email = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, email })
      });
      return await response.json();
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      return await response.json();
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async getUser(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },
  
  async getPlayer(userId, mode) {
    try {
      const response = await fetch(`${API_BASE_URL}/player/${userId}?mode=${mode}`);
      return await response.json();
    } catch (error) {
      console.error('获取玩家数据失败:', error);
      return null;
    }
  },
  
  async savePlayer(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/player/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('保存玩家数据失败:', error);
      return null;
    }
  },
  
  async saveGameRecord(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/player/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('保存游戏记录失败:', error);
      return null;
    }
  },
  
  async getUserRecords(userId, page = 1, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/player/${userId}/records?page=${page}&limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('获取游戏记录失败:', error);
      return [];
    }
  },
  
  async getRank(mode = null) {
    try {
      const url = mode ? `${API_BASE_URL}/rank?mode=${mode}` : `${API_BASE_URL}/rank`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('获取排行榜失败:', error);
      return { success: false, rankings: [] };
    }
  },
  
  async getUserInfo(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`);
      return await response.json();
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return { success: false };
    }
  },
  
  async updateUserTitle(userId, title) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, title })
      });
      return await response.json();
    } catch (error) {
      console.error('更新称号失败:', error);
      return { success: false };
    }
  },
  
  async updateUserLastLevel(userId, level) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/lastlevel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, level })
      });
      return await response.json();
    } catch (error) {
      console.error('更新上次等级失败:', error);
      return { success: false };
    }
  },
  
  async getAdminUsers(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  },
  
  async deleteUser(adminId, userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/user/${userId}?userId=${adminId}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('删除用户失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async blessing(adminId, userId, level) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/blessing?userId=${adminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, level })
      });
      return await response.json();
    } catch (error) {
      console.error('海神赐福失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async punishment(adminId, userId, level) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/punishment?userId=${adminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, level })
      });
      return await response.json();
    } catch (error) {
      console.error('神罚失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async getAdminRecords(adminId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/records?userId=${adminId}`);
      return await response.json();
    } catch (error) {
      console.error('获取记录列表失败:', error);
      return [];
    }
  },
  
  async getAllRecords(adminId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/records?userId=${adminId}&all=1`);
      return await response.json();
    } catch (error) {
      console.error('获取所有记录失败:', error);
      return [];
    }
  },
  
  async deleteRecord(adminId, recordId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/record/${recordId}?userId=${adminId}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('删除记录失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async getStatistics(adminId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics?userId=${adminId}`);
      return await response.json();
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {};
    }
  },
  
  async getAllTitles() {
    try {
      const response = await fetch(`${API_BASE_URL}/alltitles`);
      return await response.json();
    } catch (error) {
      console.error('获取已使用称号失败:', error);
      return { success: true, titles: [] };
    }
  },
  
  async addFriend(userId, friendUsername) {
    try {
      const response = await fetch(`${API_BASE_URL}/friend/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, friendUsername })
      });
      return await response.json();
    } catch (error) {
      console.error('添加好友失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async getFriendList(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/friend/list?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('获取好友列表失败:', error);
      return { success: false, friends: [] };
    }
  },
  
  async getFriendRequests(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/friend/requests?userId=${userId}`);
      return await response.json();
    } catch (error) {
      console.error('获取好友请求失败:', error);
      return { success: false, requests: [] };
    }
  },
  
  async acceptFriend(requestId) {
    try {
      const response = await fetch(`${API_BASE_URL}/friend/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId })
      });
      return await response.json();
    } catch (error) {
      console.error('接受好友请求失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async rejectFriend(requestId) {
    try {
      const response = await fetch(`${API_BASE_URL}/friend/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId })
      });
      return await response.json();
    } catch (error) {
      console.error('拒绝好友请求失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async removeFriend(userId, friendId) {
    try {
      const response = await fetch(`${API_BASE_URL}/friend/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, friendId })
      });
      return await response.json();
    } catch (error) {
      console.error('删除好友失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async sendMessage(fromId, toId, content) {
    try {
      const response = await fetch(`${API_BASE_URL}/friend/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fromId, toId, content })
      });
      return await response.json();
    } catch (error) {
      console.error('发送消息失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async getMessages(userId, friendId) {
    try {
      const response = await fetch(`${API_BASE_URL}/friend/messages?userId=${userId}&friendId=${friendId}`);
      return await response.json();
    } catch (error) {
      console.error('获取消息失败:', error);
      return { success: false, messages: [] };
    }
  },
  
  async sendFeed(fromId, toId, feedType, amount) {
    try {
      const response = await fetch(`${API_BASE_URL}/friend/send-feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fromId, toId, feedType, amount })
      });
      return await response.json();
    } catch (error) {
      console.error('赠送饲料包失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async blessingFeed(adminId, userId, feedType, amount) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/blessing-feed?userId=${adminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, feedType, amount })
      });
      return await response.json();
    } catch (error) {
      console.error('赐福饲料包失败:', error);
      return { success: false, message: '网络错误' };
    }
  },
  
  async punishmentFeed(adminId, userId, feedType, amount) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/punishment-feed?userId=${adminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, feedType, amount })
      });
      return await response.json();
    } catch (error) {
      console.error('神罚饲料包失败:', error);
      return { success: false, message: '网络错误' };
    }
  }
};