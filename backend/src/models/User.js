const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        notEmpty: true,
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
        notEmpty: true
      }
    },
    displayName: {
      type: DataTypes.STRING(100),
      field: 'display_name',
      validate: {
        len: [1, 100]
      }
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      field: 'avatar_url',
      validate: {
        isUrl: true
      }
    },
    userRole: {
      type: DataTypes.ENUM('regular', 'verified', 'admin'),
      defaultValue: 'regular',
      field: 'user_role',
      allowNull: false
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    bio: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 500]
      }
    },
    followersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'followers_count'
    },
    followingCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'following_count'
    },
    postsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'posts_count'
    }
  }, {
    tableName: 'users',
    indexes: [
      { unique: true, fields: ['username'] },
      { unique: true, fields: ['email'] },
      { fields: ['user_role'] },
      { fields: ['verified'] }
    ]
  });

  // 密碼加密 Hook
  User.beforeCreate(async (user) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 12);
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, 12);
    }
  });

  // 實例方法
  User.prototype.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  // 靜態方法
  User.findByUsername = function(username) {
    return this.findOne({ where: { username } });
  };

  User.findByEmail = function(email) {
    return this.findOne({ where: { email } });
  };

  // 關聯設定
  User.associate = function(models) {
    // 用戶的貼文
    User.hasMany(models.Post, {
      foreignKey: 'userId',
      as: 'posts'
    });

    // 用戶的追蹤關係 (作為追蹤者)
    User.hasMany(models.Follow, {
      foreignKey: 'followerId',
      as: 'following'
    });

    // 用戶的追蹤關係 (被追蹤者)
    User.hasMany(models.Follow, {
      foreignKey: 'followingId',
      as: 'followers'
    });

    // 用戶的按讚
    User.hasMany(models.Like, {
      foreignKey: 'userId',
      as: 'likes'
    });

    // 用戶的評論
    User.hasMany(models.Comment, {
      foreignKey: 'userId',
      as: 'comments'
    });
  };

  return User;
};
