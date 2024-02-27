const express = require('express')
const cors = require('cors')
const socket = require('socket.io')

const app =express()
app.use(cors())

app.get('/',(_,res)=>{
    res.send("hello from server")
})


const server =app.listen(3001,()=>{
    console.log('listening at port 3001')
})

const io =socket(server)

let rooms={}
let socketToRoom={}

io.on('connection',socket=>{
    // console.log(socket.id)
    socket.on('join',data=>{
        const roomId = data.roomId
        socket.join(roomId)
        // new user joined    broadcast to every other user
        socketToRoom[socket.id]=roomId
        console.log(roomId,data.name+" joined",socket.id)

        if(rooms[roomId]){
            rooms[roomId].push({id:socket.id,name:data.name})
        }else{
            rooms[roomId]=[{id:socket.id,name:data.name}]
        }

        const existingParticipants=rooms[roomId].filter((user)=>user.id!==socket.id)
        io.sockets.to(socket.id).emit("existing_participants",existingParticipants)
    })

    socket.on('offer',sdp=>{
        socket.broadcast.emit('getOffer',sdp)
        console.log("offer ",socket.id)
    })

    socket.on("answer",sdp=>{
        socket.broadcast.emit("getAnswer",sdp)
        console.log("answer",socket.id)
    })

    socket.on("newCandidate",candidate=>{
        socket.broadcast.emit('getCandidate',candidate)
        console.log('candidate',socket.id)
    })

    socket.on('disconnect',()=>{
        const roomId=socketToRoom[socket.id]

        let room=rooms[roomId]

        if(room){
            room=room.filter((participant)=>participant.id!==socket.id)
            rooms[roomId]=room
        }

        socket.broadcast.to(room).emit("participant_exit",{id:socket.id})
        console.log(`[${socketToRoom[socket.id]}]:${socket.id} exit`)
    })
})