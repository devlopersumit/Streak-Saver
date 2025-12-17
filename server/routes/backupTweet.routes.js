const express = require('express');
const {
    createBackupTweet,
    getAllBackupTweets,
    getBackupTweetById,
    getUnusedBackupTweets,
    getRandomUnusedBackupTweet,
    checkBackupTweetQuota,
    updateBackupTweet,
    markBackupTweetAsUsed,
    deleteBackupTweet
} = require('../controller/backupTweet.controller');

const backupTweetRouter = express.Router();

backupTweetRouter.post('/', createBackupTweet);
backupTweetRouter.get('/', getAllBackupTweets);
backupTweetRouter.get('/user/:userId/unused', getUnusedBackupTweets);
backupTweetRouter.get('/user/:userId/quota', checkBackupTweetQuota);
backupTweetRouter.get('/user/:userId/random-unused', getRandomUnusedBackupTweet);
backupTweetRouter.patch('/:id/mark-used', markBackupTweetAsUsed);
backupTweetRouter.get('/:id', getBackupTweetById);
backupTweetRouter.put('/:id', updateBackupTweet);
backupTweetRouter.delete('/:id', deleteBackupTweet);

module.exports = backupTweetRouter;
