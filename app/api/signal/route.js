import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/api/signal/socket.io'
    });

    io.on("connection", (socket) => {
      console.log('A user connected:', socket.id);

      socket.on("offer", (offer) => {
        socket.broadcast.emit("offer", offer);
      });

      socket.on("answer", (answer) => {
        socket.broadcast.emit("answer", answer);
      });

      socket.on("ice-candidate", (candidate) => {
        socket.broadcast.emit("ice-candidate", candidate);
      });

      socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}
