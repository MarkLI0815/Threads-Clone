const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 建立 Sequelize 實例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define,
    pool: dbConfig.pool
  }
);

// 匯入模型
const User = require('./User')(sequelize);
const Post = require('./Post')(sequelize);
const Follow = require('./Follow')(sequelize);
const Like = require('./Like')(sequelize);
const Comment = require('./Comment')(sequelize);

// 定義模型關聯
const models = { User, Post, Follow, Like, Comment };

// 設定關聯關係
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// 測試資料庫連接
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully');
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err);
  });

module.exports = {
  sequelize,
  Sequelize,
  ...models
};
