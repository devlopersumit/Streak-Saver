const mongoose = require('mongoose');

const backupTweetSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    content:{
        type:String,
        required:true
    },
    used:{
        type:Boolean,
        default:false
    },
    usedAt:{
        type:Date
    }
}, {
    timestamps:true
});

module.exports = mongoose.model("BackupTweet", backupTweetSchema);