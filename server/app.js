const express = require('express');
require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
const userRouter = require('./routes/user.routes');
const backupTweetRouter = require('./routes/backupTweet.routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

require('./jobs/StreakCheck.job');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "Streak Saver API is running! 🚀",
        version: "1.0.0",
        endpoints: {
            users: "/api/users",
            backupTweets: "/api/backup-tweets"
        }
    });
});

connectDB();

app.use('/api/users', userRouter);
app.use('/api/backup-tweets', backupTweetRouter);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`✅ Server is running successfully on port ${port}`);
    console.log(`🌐 API available at http://localhost:${port}`);
});
