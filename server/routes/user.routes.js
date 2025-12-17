const express = require('express');
const {
    createUser,
    getAllUsers,
    getUserById,
    getUserByXUserId,
    updateUser,
    updateLastPosted,
    connectXAccount,
    deleteUser,
    getUserStats
} = require('../controller/user.controller');

const userRouter = express.Router();

userRouter.post('/', createUser);
userRouter.get('/', getAllUsers);
userRouter.get('/:id/stats', getUserStats);
userRouter.get('/x/:xUserId', getUserByXUserId);
userRouter.get('/:id', getUserById);
userRouter.patch('/:id/last-posted', updateLastPosted);
userRouter.patch('/:id/connect-x-account', connectXAccount);
userRouter.put('/:id', updateUser);
userRouter.delete('/:id', deleteUser);

module.exports = userRouter;
