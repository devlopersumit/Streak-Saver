const User = require("../models/User");
const BackupTweet = require("../models/BackupTweet");

const createUser = async (req, res) => {
    try {
        if (req.body.xUserId) {
            const existingUser = await User.findOne({ xUserId: req.body.xUserId });
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: "User with this X/Twitter ID already exists" 
                });
            }
        }

        const user = await User.create(req.body);
        
        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create user",
            error: error.message
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
            error: error.message
        });
    }
};

const getUserByXUserId = async (req, res) => {
    try {
        const user = await User.findOne({ xUserId: req.params.xUserId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
            error: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { 
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update user",
            error: error.message
        });
    }
};

const updateLastPosted = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { lastPostedAt: new Date() },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Last posted timestamp updated",
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update last posted timestamp",
            error: error.message
        });
    }
};

const connectXAccount = async (req, res) => {
    try {
        if (!req.body.accessToken || !req.body.xUserId) {
            return res.status(400).json({
                success: false,
                message: "accessToken and xUserId are required"
            });
        }

        const existingUser = await User.findById(req.params.id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                accessToken: req.body.accessToken,
                refreshToken: req.body.refreshToken || existingUser.refreshToken,
                xUserId: req.body.xUserId,
                username: req.body.username || existingUser.username
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "X account connected successfully",
            data: {
                id: user._id,
                username: user.username,
                xUserId: user.xUserId,
                hasXAccountConnected: true
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to connect X account",
            error: error.message
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await BackupTweet.deleteMany({ userId: req.params.id });

        res.status(200).json({
            success: true,
            message: "User and associated backup tweets deleted successfully",
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
};

const getUserStats = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const totalBackupTweets = await BackupTweet.countDocuments({ userId: req.params.id });
        const usedBackupTweets = await BackupTweet.countDocuments({ userId: req.params.id, used: true });
        const unusedBackupTweets = totalBackupTweets - usedBackupTweets;

        let hoursSinceLastPost = null;
        let streakDays = 0;
        if (user.lastPostedAt) {
            const diffInMs = new Date() - new Date(user.lastPostedAt);
            hoursSinceLastPost = Math.floor(diffInMs / (1000 * 60 * 60));
            streakDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        }

        const maxBackupTweets = user.plan === 'FREE' ? 5 : 'unlimited';
        const canAddMore = user.plan !== 'FREE' || unusedBackupTweets < 5;
        const isStreakActive = hoursSinceLastPost !== null && hoursSinceLastPost < 24;

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    xUserId: user.xUserId,
                    plan: user.plan,
                    isActive: user.isActive,
                    hasXAccountConnected: !!user.accessToken,
                    lastPostedAt: user.lastPostedAt,
                    createdAt: user.createdAt
                },
                stats: {
                    totalBackupTweets,
                    usedBackupTweets,
                    unusedBackupTweets,
                    maxBackupTweets,
                    canAddMore,
                    hoursSinceLastPost,
                    streakDays,
                    isStreakActive
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch user stats",
            error: error.message
        });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    getUserByXUserId,
    updateUser,
    updateLastPosted,
    connectXAccount,
    deleteUser,
    getUserStats
};
