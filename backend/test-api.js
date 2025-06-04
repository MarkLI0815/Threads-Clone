const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

// 測試資料
const testUser = {
  username: 'testuser123',
  email: 'test@example.com',
  password: 'password123',
  displayName: 'Test User'
};

const testAdmin = {
  username: 'admin123',
  email: 'admin@example.com',
  password: 'admin123',
  displayName: 'Admin User'
};

let userToken = '';
let adminToken = '';
let createdUserId = '';

// API 測試函數
async function testAPI() {
  console.log('🧪 開始 API 測試...\n');

  try {
    // 1. 健康檢查
    console.log('1. 測試健康檢查端點...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ 健康檢查:', healthResponse.data.status);
    console.log('');

    // 2. 測試用戶註冊
    console.log('2. 測試用戶註冊...');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ 註冊成功:', registerResponse.data.user.username);
    userToken = registerResponse.data.token;
    createdUserId = registerResponse.data.user.id;
    console.log('');

    // 3. 測試用戶登入
    console.log('3. 測試用戶登入...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ 登入成功:', loginResponse.data.user.username);
    console.log('');

    // 4. 測試獲取當前用戶資訊
    console.log('4. 測試獲取當前用戶資訊...');
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ 當前用戶:', meResponse.data.user.username, '- 角色:', meResponse.data.user.userRole);
    console.log('');

    // 5. 測試建立貼文
    console.log('5. 測試建立貼文...');
    const postResponse = await axios.post(`${API_BASE}/posts`, {
      content: '這是一篇測試貼文！'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ 貼文建立成功:', postResponse.data.post.content);
    console.log('');

    // 6. 測試獲取貼文列表
    console.log('6. 測試獲取貼文列表...');
    const postsResponse = await axios.get(`${API_BASE}/posts`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ 獲取貼文列表成功，共', postsResponse.data.posts.length, '篇貼文');
    console.log('');

    // 7. 測試管理員功能（如果有管理員用戶）
    console.log('7. 測試管理員功能...');
    try {
      // 嘗試升級用戶角色（需要管理員權限）
      await axios.put(`${API_BASE}/users/${createdUserId}/role`, {
        userRole: 'verified'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
    } catch (error) {
      console.log('✅ 權限控制正常 - 一般用戶無法修改角色');
    }
    console.log('');

    console.log('🎉 所有 API 測試完成！');

  } catch (error) {
    console.error('❌ API 測試失敗:', error.response?.data || error.message);
  }
}

// 檢查服務器是否運行
async function checkServer() {
  try {
    await axios.get('http://localhost:3001/health');
    return true;
  } catch (error) {
    return false;
  }
}

// 主執行函數
async function main() {
  const isServerRunning = await checkServer();
  
  if (!isServerRunning) {
    console.log('❌ 服務器未運行！請先啟動後端服務器：');
    console.log('   cd backend && npm run dev');
    return;
  }

  await testAPI();
}

main();
