import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
    },
});

const rooms = {};

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinRoom", (room) => {
        if (socket.room) {
            socket.leave(socket.room);
        }

        socket.join(room);
        socket.room = room;

        if (!rooms[room]) {
            rooms[room] = {
                host: null,
                videoId: null,
                isPlaying: false,
                currentTime: 0
            };
        }

        let role;

        if (!rooms[room].host) {
            rooms[room].host = socket.id;
            role = "host";
        } else {
            role = "guest";
        }

        console.log(`${socket.id} joined ${room} as ${role}`);

        socket.emit("roleAssigned", role);

        if (rooms[room].videoId) {
            socket.emit("loadVideo", rooms[room].videoId);
        }
    });

    socket.on("requestHost", () => {
        const room = socket.room;

        if (!room) {
            return;
        }

        if (!rooms[room]) {
            return;
        }

        const oldHost = rooms[room].host;

        rooms[room].host = socket.id;

        console.log(`${socket.id} became host in ${room}`);

        if (oldHost) {
            io.to(oldHost).emit("roleAssigned", "guest");
        }

        io.to(socket.id).emit("roleAssigned", "host");
    });

    socket.on("hello", (message) => {
        console.log("Received from client:", message);
        io.to(socket.room).emit("welcome", "Hello from the server!");
    });

    socket.on("loadVideo", (videoId) => {
        console.log("Host loaded:", videoId);

        rooms[socket.room].videoId = videoId;

        io.to(socket.room).emit("loadVideo", videoId);
    });

    socket.on("play", () => {
        console.log("Host pressed play. Room:", socket.room);

        rooms[socket.room].isPlaying = true;

        io.to(socket.room).emit("play");
    });

    socket.on("pause", () => {
        console.log("Host pressed pause. Room:", socket.room);

        rooms[socket.room].isPlaying = false;

        io.to(socket.room).emit("pause");
    });

    socket.on("seek", (currentTime) => {
        console.log("Host pressed seek. Room:", socket.room);
        rooms[socket.room].currentTime = currentTime;

        io.to(socket.room).emit("seek", currentTime);
    });

    socket.on("playerReady", () => {
        const room = socket.room;

        if (!room || !rooms[room]) {
            return;
        }

        const roomState = rooms[room];

        console.log(`${socket.id} player is ready in ${room}`);

        if (roomState.videoId) {
            socket.emit("loadVideo", roomState.videoId);
        }
    });

    socket.on("videoCued", () => {
        const room = socket.room;

        if (!room || !rooms[room]) {
            return;
        }

        const host = rooms[room].host;

        console.log(`${socket.id} video cued in ${room}`);

        if (!host) {
            return;
        }

        io.to(host).emit("requestSync", socket.id);
    });

    // Handle sync response from host

    socket.on("syncResponse", ({ guestSocketId, currentTime, isPlaying }) => {
        console.log("Received sync response from host:", currentTime);

        io.to(guestSocketId).emit("syncState", {
            currentTime,
            isPlaying,
        });
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        if (socket.room && rooms[socket.room]) {
            if (rooms[socket.room].host === socket.id) {
                rooms[socket.room].host = null;
            }
        }
    });
});

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});