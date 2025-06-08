// backend/src/models/Post.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Post = sequelize.define('Post', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: () => 'post-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
        },
        userId: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'user_id'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'content'
        },
        imageUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: 'image_url'
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
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at'
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        }
    }, {
        tableName: 'posts',
        timestamps: true,
        underscored: false,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Post;
};