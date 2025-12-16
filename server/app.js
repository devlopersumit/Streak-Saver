const express = require('express');
require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("Server is perfectly running on server")
});

//Database Connection
connectDB();

const port = process.env.PORT;
app.listen(port, ()=>{
    console.log(`Server is running succcessfully on server ${port}`)
});