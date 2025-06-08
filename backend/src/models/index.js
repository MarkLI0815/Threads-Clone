// backend/src/models/index.js - 包含 Notification 模型
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'social_platform',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'rootpassword123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);

const db = {};

// 手動載入模型（包含 Notification）
const modelFiles = [
  'User.js',
  'Post.js', 
  'Follow.js',
  'Like.js',
  'Comment.js',
  'Notification.js'  // 新增通知模型
];

// 載入所有模型
modelFiles.forEach(file => {
  const modelPath = path.join(__dirname, file);
  
  // 檢查文件是否存在
  if (fs.existsSync(modelPath)) {
    console.log(`Loading model: ${file}`);
    try {
      const model = require(modelPath)(sequelize);
      db[model.name] = model;
      console.log(`✅ ${model.name} model loaded successfully`);
    } catch (error) {
      console.error(`❌ Error loading model ${file}:`, error.message);
    }
  } else {
    console.warn(`Model file not found: ${file}`);
  }
});

// ✅ 明確映射模型名稱，確保解構導入正常工作
const User = db.User;
const Post = db.Post;
const Like = db.Like;
const Comment = db.Comment;
const Follow = db.Follow;
const Notification = db.Notification;  // 新增通知模型

// ✅ 除錯：顯示模型載入狀態
console.log('🔍 模型載入檢查:');
console.log('User:', User ? '✅ 已載入' : '❌ 未載入');
console.log('Post:', Post ? '✅ 已載入' : '❌ 未載入');
console.log('Like:', Like ? '✅ 已載入' : '❌ 未載入');
console.log('Comment:', Comment ? '✅ 已載入' : '❌ 未載入');
console.log('Follow:', Follow ? '✅ 已載入' : '❌ 未載入');
console.log('Notification:', Notification ? '✅ 已載入' : '❌ 未載入');

// 顯示載入的模型
console.log('Loaded models:', Object.keys(db));

// 🔧 手動建立關聯關係（只有在模型存在時才建立）
if (User && Post) {
  // User has many Posts
  User.hasMany(Post, {
    foreignKey: 'userId',
    as: 'posts'
  });
  
  // Post belongs to User
  Post.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  console.log('✅ User-Post associations created');
}

if (User && Like) {
  // User has many Likes
  User.hasMany(Like, {
    foreignKey: 'userId',
    as: 'likes'
  });
  
  // Like belongs to User
  Like.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  console.log('✅ User-Like associations created');
}

if (Post && Like) {
  // Post has many Likes
  Post.hasMany(Like, {
    foreignKey: 'postId',
    as: 'likes'
  });
  
  // Like belongs to Post
  Like.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post'
  });
  
  console.log('✅ Post-Like associations created');
}

if (User && Comment) {
  // User has many Comments
  User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments'
  });
  
  // Comment belongs to User
  Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  console.log('✅ User-Comment associations created');
}

if (Post && Comment) {
  // Post has many Comments
  Post.hasMany(Comment, {
    foreignKey: 'postId',
    as: 'comments'
  });
  
  // Comment belongs to Post
  Comment.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post'
  });
  
  console.log('✅ Post-Comment associations created');
}

if (User && Follow) {
  // User has many Followers
  User.hasMany(Follow, {
    foreignKey: 'followingId',
    as: 'followers'
  });
  
  // User has many Following
  User.hasMany(Follow, {
    foreignKey: 'followerId',
    as: 'following'
  });
  
  // Follow belongs to Users
  Follow.belongsTo(User, {
    foreignKey: 'followerId',
    as: 'follower'
  });
  
  Follow.belongsTo(User, {
    foreignKey: 'followingId',
    as: 'following'
  });
  
  console.log('✅ User-Follow associations created');
}

// 🔔 新增通知模型關聯
if (User && Notification) {
  // User has many Notifications (接收者)
  User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'notifications'
  });
  
  // Notification belongs to User (接收者)
  Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // User has many Notifications (發送者)
  User.hasMany(Notification, {
    foreignKey: 'fromUserId',
    as: 'sentNotifications'
  });
  
  // Notification belongs to User (發送者)
  Notification.belongsTo(User, {
    foreignKey: 'fromUserId',
    as: 'fromUser'
  });
  
  console.log('✅ User-Notification associations created');
}

// ✅ 將模型添加到 db 對象中（確保解構導入正常）
db.User = User;
db.Post = Post;
db.Like = Like;
db.Comment = Comment;
db.Follow = Follow;
db.Notification = Notification;  // 新增通知模型
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 測試連接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 資料庫連接成功');
    
    console.log('✅ 使用現有資料庫結構，不進行同步');
    
    // 顯示所有關聯
    console.log('📊 模型關聯設置完成:', {
      User: User ? '✅' : '❌',
      Post: Post ? '✅' : '❌',
      Like: Like ? '✅' : '❌',
      Comment: Comment ? '✅' : '❌',
      Follow: Follow ? '✅' : '❌',
      Notification: Notification ? '✅' : '❌'
    });
    
    // ✅ 最終檢查：確保模型可以被解構導入
    console.log('🔍 解構導入測試:', {
      'db.User': db.User ? '✅' : '❌',
      'db.Post': db.Post ? '✅' : '❌',
      'db.Like': db.Like ? '✅' : '❌',
      'db.Comment': db.Comment ? '✅' : '❌',
      'db.Follow': db.Follow ? '✅' : '❌',
      'db.Notification': db.Notification ? '✅' : '❌'
    });
    
  } catch (error) {
    console.error('❌ 資料庫連接失敗:', error);
  }
};

testConnection();

module.exports = db;