const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      field: 'user_id'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 2000],
        notEmpty: true
      }
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      field: 'image_url',
      validate: {
        isUrl: true
      }
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'like_count'
    },
    commentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'comment_count'
    }
  }, {
    tableName: 'posts',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['created_at'] },
      { fields: ['like_count'] }
    ]
  });

  Post.associate = function(models) {
    Post.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'author'
    });

    Post.hasMany(models.Like, {
      foreignKey: 'postId',
      as: 'likes'
    });

    Post.hasMany(models.Comment, {
      foreignKey: 'postId',
      as: 'comments'
    });
  };

  return Post;
};
