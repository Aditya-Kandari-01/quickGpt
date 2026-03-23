import 'dotenv/config'
import express from 'express'
import cors from "cors"
import connectDb from "./configs/db.js"
import userRouter from "./routes/userRoutes.js"
import chatRouter from './routes/chatRoutes.js'
import messageRouter from './routes/messageRoutes.js'
const app = express()
const PORT = process.env.PORT || 3000

// db connection
await connectDb()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.get('/',(req,res)=>{
    res.send('ur server is live')
})
app.use('/api/user',userRouter)
app.use('/api/chat',chatRouter)
app.use('/api/message',messageRouter)

app.listen(PORT,()=>{
    console.log(`Listening on port ${PORT}`)
})
