import 'dotenv/config'
import { configDotenv } from 'dotenv'
import express from 'express'
import { connectDB } from './config/database.js'

connectDB()
const app = express()
configDotenv()

app.get('/', (req, res) => {
  res.send('route path /')
})

app.use(express.json());

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})