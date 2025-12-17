const cron = require('node-cron');
const User = require('../models/User');
const BackupTweet = require('../models/BackupTweet');
const { postTweet, checkRecentPosts, refreshAccessToken } = require('../services/xApiService');

const streakCheckJob = async () => {
    try {
        console.log('🔍 Starting daily streak check...');
        console.log('⏰ Time:', new Date().toISOString());
        
        const activeUsers = await User.find({ 
            isActive: true,
            accessToken: { $exists: true, $ne: null }
        });
        
        console.log(`📊 Checking ${activeUsers.length} active users with connected X accounts...`);
        
        let usersChecked = 0;
        let usersNeedingPost = 0;
        let tweetsPosted = 0;
        let errors = 0;
        
        for (const user of activeUsers) {
            usersChecked++;
            
            try {
                const recentPosts = await checkRecentPosts(user.accessToken, user.xUserId);
                
                const now = new Date();
                const lastPosted = user.lastPostedAt;
                let hoursSinceLastPost = null;
                
                if (lastPosted) {
                    const diffInMs = now - lastPosted;
                    hoursSinceLastPost = Math.floor(diffInMs / (1000 * 60 * 60));
                } else {
                    hoursSinceLastPost = 999;
                }
                
                const needsPost = !recentPosts.hasPosted && hoursSinceLastPost >= 24;
                
                if (needsPost) {
                    usersNeedingPost++;
                    
                    const unusedBackupTweets = await BackupTweet.find({
                        userId: user._id,
                        used: false
                    }).sort({ createdAt: 1 });
                    
                    if (unusedBackupTweets.length > 0) {
                        const backupTweetToPost = unusedBackupTweets[0];
                        
                        try {
                            console.log(`📱 Posting backup tweet for user: ${user.username || user.xUserId}`);
                            const postedTweet = await postTweet(user.accessToken, backupTweetToPost.content);
                            
                            backupTweetToPost.used = true;
                            backupTweetToPost.usedAt = new Date();
                            await backupTweetToPost.save();
                            
                            user.lastPostedAt = new Date();
                            await user.save();
                            
                            tweetsPosted++;
                            console.log(`✅ Successfully posted backup tweet for ${user.username || user.xUserId}`);
                            console.log(`   Tweet ID: ${postedTweet.id}`);
                            console.log(`   Content: "${backupTweetToPost.content.substring(0, 50)}..."`);
                            
                        } catch (postError) {
                            errors++;
                            console.error(`❌ Failed to post backup tweet for ${user.username || user.xUserId}:`, postError.message);
                            
                            if (postError.message.includes('auth') || postError.message.includes('token')) {
                                console.log(`   Attempting to refresh token for ${user.username || user.xUserId}...`);
                                try {
                                    const newTokens = await refreshAccessToken(user.refreshToken);
                                    user.accessToken = newTokens.accessToken;
                                    user.refreshToken = newTokens.refreshToken;
                                    await user.save();
                                    console.log(`   ✅ Token refreshed successfully`);
                                } catch (refreshError) {
                                    console.error(`   ❌ Token refresh failed:`, refreshError.message);
                                }
                            }
                        }
                    } else {
                        console.log(`⚠️  User ${user.username || user.xUserId} needs to post but has no backup tweets available`);
                        console.log(`   Last posted: ${hoursSinceLastPost} hours ago`);
                        console.log(`   Unused backup tweets: 0`);
                    }
                } else {
                    if (recentPosts.lastPostTime && (!user.lastPostedAt || new Date(recentPosts.lastPostTime) > user.lastPostedAt)) {
                        user.lastPostedAt = new Date(recentPosts.lastPostTime);
                        await user.save();
                    }
                }
            } catch (userError) {
                errors++;
                console.error(`❌ Error processing user ${user.username || user.xUserId}:`, userError.message);
            }
        }
        
        console.log('\n✅ Streak check completed!');
        console.log(`   Users checked: ${usersChecked}`);
        console.log(`   Users needing post: ${usersNeedingPost}`);
        console.log(`   Backup tweets posted: ${tweetsPosted}`);
        console.log(`   Errors: ${errors}`);
        console.log(`   Next check: Tomorrow at 00:00\n`);
        
    } catch (error) {
        console.error('❌ Critical error in streak check job:', error.message);
        console.error(error.stack);
    }
};

cron.schedule('0 0 * * *', async () => {
    await streakCheckJob();
}, {
    timezone: "UTC"
});

module.exports = streakCheckJob;

console.log('⏰ Streak check job scheduled to run daily at 00:00 UTC');
