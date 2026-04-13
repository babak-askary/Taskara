const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const routes = require('./routes'); // Assuming you have a routes.js file for your API routes

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON
app.use(express.json());

// Database connection
action = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/yourdbname', { // Replace with your database name
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Database connection error:', err);
    }
};

action();

// Socket.io connection
ios.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Define routes
app.use('/api', routes); // Use routes defined in routes.js (if applicable)

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});