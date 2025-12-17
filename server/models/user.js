const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    xUserId:{
        type:String,
        required:false
    },
    username:{
        type:String
    },
    accessToken:{
        type:String
    },
    refreshToken:{
        type:String
    },
    lastPostedAt:{
        type:Date
    },
    plan:{
        type:String,
        default:'FREE'
    },
    isActive:{
        type:Boolean,
        default:true
    }
}, {
    timestamps:true
});

module.exports = mongoose.model('User', userSchema);