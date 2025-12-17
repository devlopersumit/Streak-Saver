const express = require('express');
require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
const userRouter = require('./routes/user.routes');
require('./jobs/StreakCheck.job');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("Server is perfectly running on server")
});

//Database Connection
connectDB();

app.use('/api/users', userRouter);

const port = process.env.PORT || 5000;
app.listen(port, ()=>{
    console.log(`Server is running succcessfully on server ${port}`)
});