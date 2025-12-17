const mongoose = require('mongoose');

const backupTweetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    content: {
        type: String,
        required: [true, 'Tweet content is required'],
        trim: true,
        maxlength: [280, 'Tweet content cannot exceed 280 characters']
    },
    used: {
        type: Boolean,
        default: false,
        index: true
    },
    usedAt: {
        type: Date
    }
}, {
    timestamps: true
});

backupTweetSchema.index({ userId: 1, used: 1 });

module.exports = mongoose.model("BackupTweet", backupTweetSchema);
