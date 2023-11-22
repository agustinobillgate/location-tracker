const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store user locations
const users = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User connected');

  // Send the current locations of all users to the new client
  Object.keys(users).forEach(userId => {
    const user = users[userId];
    socket.emit('updateLocation', { id: userId, location: user.location });
  });

  // Listen for location updates
  socket.on('locationUpdate', (userLocation) => {
    console.log(`Received location update from ${socket.id}:`, userLocation);

    users[socket.id] = { location: userLocation };

    io.emit('updateLocation', { id: socket.id, location: userLocation });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    // Remove the user from the stored locations on disconnect
    delete users[socket.id];
  });
});

// Periodically broadcast all user locations every 5 seconds
setInterval(() => {
  io.emit('broadcastAllLocations', users);
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
