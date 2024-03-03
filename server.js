// const express = require('express')
// const cors = require('cors')
// const socket = require('socket.io')

// const app =express()
// app.use(cors())

// app.get('/',(_,res)=>{
//     res.send("hello from server")
// })


// const server =app.listen(3001,()=>{
//     console.log('listening at port 3001')
// })

// const io =socket(server)

// let rooms={}
// let socketToRoom={}

// io.on('connection',socket=>{
//     // console.log(socket.id)
//     socket.on('join',data=>{
//         const roomId = data.roomId
        
//         // new user joined    broadcast to every other user
//         socketToRoom[socket.id]=roomId
        
//         console.log(roomId,data.name+" joined",socket.id)
        
//         socket.join(roomId)
//         io.to(roomId).emit("user-joined",{name:data.name,id:socket.id})
//         if(rooms[roomId]){
//             rooms[roomId].push({id:socket.id,name:data.name})
//         }else{
//             rooms[roomId]=[{id:socket.id,name:data.name}]
//         }

//         const existingParticipants=rooms[roomId].filter((user)=>user.id!==socket.id)
//         io.sockets.to(socket.id).emit("existing_participants",existingParticipants)
//     })

//     socket.on('offer',sdp=>{
//         socket.broadcast.emit('getOffer',sdp)
//         console.log("offer ",socket.id)
//     })

//     socket.on("answer",sdp=>{
//         socket.broadcast.emit("getAnswer",sdp)
//         console.log("answer",socket.id)
//     })

//     socket.on("newCandidate",candidate=>{
//         socket.broadcast.emit('getCandidate',candidate)
//         console.log('candidate',socket.id)
//     })
//     socket.on("negoneeded",({offer,to})=>{
//         io.to(to).emit("negoneeded",{from:socket.id,offer})
//     })
   
//     socket.on("negodone",({to,ans})=>{
//         io.to(to).emit("negofinal",{from:socket.id,ans})
//     })

//     socket.on('disconnect',()=>{
//         const roomId=socketToRoom[socket.id]

//         let room=rooms[roomId]

//         if(room){
//             room=room.filter((participant)=>participant.id!==socket.id)
//             rooms[roomId]=room
//         }

//         socket.broadcast.to(room).emit("participant_exit",{id:socket.id})
//         console.log(`[${socketToRoom[socket.id]}]:${socket.id} exit`)
//     })
// })
// // 'use strict';

// // var os = require('os');
// // var nodeStatic = require('node-static');
// // var http = require('http');
// // var socketIO = require('socket.io');

// // var fileServer = new(nodeStatic.Server)();
// // var app = http.createServer(function(req, res) {
// //   fileServer.serve(req, res);
// // }).listen(8080);

// // var io = socketIO.listen(app);
// // io.sockets.on('connection', function(socket) {

// //   // convenience function to log server messages on the client
// //   function log() {
// //     var array = ['Message from server:'];
// //     array.push.apply(array, arguments);
// //     socket.emit('log', array);
// //   }

// //   socket.on('message', function(message) {
// //     log('Client said: ', message);
// //     // for a real app, would be room-only (not broadcast)
// //     socket.broadcast.emit('message', message);
// //   });

// //   socket.on('create or join', function(room) {
// //     log('Received request to create or join room ' + room);

// //     var clientsInRoom = io.sockets.adapter.rooms[room];
// //     var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
// //     log('Room ' + room + ' now has ' + numClients + ' client(s)');

// //     if (numClients === 0) {
// //       socket.join(room);
// //       log('Client ID ' + socket.id + ' created room ' + room);
// //       socket.emit('created', room, socket.id);
// //     } else if (numClients === 1) {
// //       log('Client ID ' + socket.id + ' joined room ' + room);
// //       // io.sockets.in(room).emit('join', room);
// //       socket.join(room);
// //       socket.emit('joined', room, socket.id);
// //       io.sockets.in(room).emit('ready', room);
// //       socket.broadcast.emit('ready', room);
// //     } else { // max two clients
// //       socket.emit('full', room);
// //     }
// //   });

// //   socket.on('ipaddr', function() {
// //     var ifaces = os.networkInterfaces();
// //     for (var dev in ifaces) {
// //       ifaces[dev].forEach(function(details) {
// //         if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
// //           socket.emit('ipaddr', details.address);
// //         }
// //       });
// //     }
// //   });

// //   socket.on('disconnect', function(reason) {
// //     console.log(`Peer or server disconnected. Reason: ${reason}.`);
// //     socket.broadcast.emit('bye');
// //   });

// //   socket.on('bye', function(room) {
// //     console.log(`Peer said bye on room ${room}.`);
// //   });
// // });

const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});