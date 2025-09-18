import { configDotenv } from 'dotenv'
import express from 'express'

const app = express()
configDotenv()

app.get('/', (req, res) => {
  res.send('route path /')
})

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`)
})