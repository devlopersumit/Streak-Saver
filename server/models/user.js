const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    xUserId: {
        type: String,
        trim: true,
        sparse: true,
        index: true
    },
    username: {
        type: String,
        trim: true
    },
    accessToken: {
        type: String,
        trim: true
    },
    refreshToken: {
        type: String,
        trim: true
    },
    lastPostedAt: {
        type: Date,
        index: true
    },
    plan: {
        type: String,
        enum: ['FREE', 'PREMIUM', 'PRO'],
        default: 'FREE'
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

userSchema.index({ xUserId: 1 });

module.exports = mongoose.model('User', userSchema);
