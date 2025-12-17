const BackupTweet = require("../models/BackupTweet");
const User = require("../models/User");

const canUserAddBackupTweet = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        return { canAdd: false, reason: "User not found" };
    }

    if (user.plan === 'PREMIUM' || user.plan === 'PRO') {
        return { canAdd: true };
    }

    const unusedCount = await BackupTweet.countDocuments({
        userId: userId,
        used: false
    });

    if (unusedCount >= 5) {
        return {
            canAdd: false,
            reason: "FREE plan limit reached. Upgrade to PREMIUM for unlimited backup tweets.",
            currentCount: unusedCount,
            maxCount: 5
        };
    }

    return { canAdd: true, remaining: 5 - unusedCount };
};

const createBackupTweet = async (req, res) => {
    try {
        if (!req.body.userId || !req.body.content) {
            return res.status(400).json({
                success: false,
                message: "userId and content are required"
            });
        }

        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const canAdd = await canUserAddBackupTweet(req.body.userId);
        if (!canAdd.canAdd) {
            return res.status(403).json({
                success: false,
                message: canAdd.reason,
                currentCount: canAdd.currentCount,
                maxCount: canAdd.maxCount,
                upgradeMessage: "Upgrade to PREMIUM plan ($5/month) for unlimited backup tweets"
            });
        }

        const backupTweet = await BackupTweet.create({
            userId: req.body.userId,
            content: req.body.content
        });

        const unusedCount = await BackupTweet.countDocuments({
            userId: req.body.userId,
            used: false
        });

        res.status(201).json({
            success: true,
            message: "Backup tweet created successfully",
            data: backupTweet,
            stats: {
                unusedCount: unusedCount,
                maxAllowed: user.plan === 'FREE' ? 5 : 'unlimited',
                plan: user.plan
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create backup tweet",
            error: error.message
        });
    }
};

const getAllBackupTweets = async (req, res) => {
    try {
        const query = {};
        
        if (req.query.userId) {
            query.userId = req.query.userId;
        }

        if (req.query.used !== undefined) {
            query.used = req.query.used === 'true';
        }

        const backupTweets = await BackupTweet.find(query)
            .populate('userId', 'username xUserId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: backupTweets.length,
            data: backupTweets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch backup tweets",
            error: error.message
        });
    }
};

const getBackupTweetById = async (req, res) => {
    try {
        const backupTweet = await BackupTweet.findById(req.params.id)
            .populate('userId', 'username xUserId');

        if (!backupTweet) {
            return res.status(404).json({
                success: false,
                message: "Backup tweet not found"
            });
        }

        res.status(200).json({
            success: true,
            data: backupTweet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch backup tweet",
            error: error.message
        });
    }
};

const getUnusedBackupTweets = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const backupTweets = await BackupTweet.find({
            userId: req.params.userId,
            used: false
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: backupTweets.length,
            data: backupTweets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch unused backup tweets",
            error: error.message
        });
    }
};

const updateBackupTweet = async (req, res) => {
    try {
        const backupTweet = await BackupTweet.findByIdAndUpdate(
            req.params.id,
            req.body,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!backupTweet) {
            return res.status(404).json({
                success: false,
                message: "Backup tweet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Backup tweet updated successfully",
            data: backupTweet
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update backup tweet",
            error: error.message
        });
    }
};

const markBackupTweetAsUsed = async (req, res) => {
    try {
        const backupTweet = await BackupTweet.findByIdAndUpdate(
            req.params.id,
            { 
                used: true,
                usedAt: new Date()
            },
            { new: true }
        );

        if (!backupTweet) {
            return res.status(404).json({
                success: false,
                message: "Backup tweet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Backup tweet marked as used",
            data: backupTweet
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to mark backup tweet as used",
            error: error.message
        });
    }
};

const deleteBackupTweet = async (req, res) => {
    try {
        const backupTweet = await BackupTweet.findByIdAndDelete(req.params.id);

        if (!backupTweet) {
            return res.status(404).json({
                success: false,
                message: "Backup tweet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Backup tweet deleted successfully",
            data: backupTweet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete backup tweet",
            error: error.message
        });
    }
};

const getRandomUnusedBackupTweet = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const backupTweets = await BackupTweet.find({
            userId: req.params.userId,
            used: false
        });

        if (backupTweets.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No unused backup tweets found for this user"
            });
        }

        const randomIndex = Math.floor(Math.random() * backupTweets.length);
        const randomTweet = backupTweets[randomIndex];

        res.status(200).json({
            success: true,
            data: randomTweet
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch random backup tweet",
            error: error.message
        });
    }
};

const checkBackupTweetQuota = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const unusedCount = await BackupTweet.countDocuments({
            userId: req.params.userId,
            used: false
        });

        const totalCount = await BackupTweet.countDocuments({
            userId: req.params.userId
        });

        const maxAllowed = user.plan === 'FREE' ? 5 : 'unlimited';
        const canAddMore = user.plan !== 'FREE' || unusedCount < 5;

        res.status(200).json({
            success: true,
            data: {
                plan: user.plan,
                unusedCount: unusedCount,
                totalCount: totalCount,
                maxAllowed: maxAllowed,
                canAddMore: canAddMore,
                remaining: user.plan === 'FREE' ? Math.max(0, 5 - unusedCount) : 'unlimited'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to check quota",
            error: error.message
        });
    }
};

module.exports = {
    createBackupTweet,
    getAllBackupTweets,
    getBackupTweetById,
    getUnusedBackupTweets,
    getRandomUnusedBackupTweet,
    checkBackupTweetQuota,
    updateBackupTweet,
    markBackupTweetAsUsed,
    deleteBackupTweet
};
