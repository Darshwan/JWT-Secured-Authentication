import 'dotenv/config'
import { configDotenv } from 'dotenv'
import express from 'express'
import { connectDB } from './config/database.js'
import User from './models/userModel.js'
import jwt from 'jsonwebtoken'
import Token from './models/tokenSchema.js'
import verificationToken from 'crypto'
import sendVerificationEmail from './services/emailService.js'

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

function generateToken() {
  return jwt.sign({ id: userId}, process.env.JWT_SECRET, { expiresIn: '1h' })
}

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(!token) return res.status(401).json({error: 'Access token required'})

  try {
    const blackListedToken = await Token.findOne({token})
    if(blackListedToken) {
      return res.status(403).json({error: 'Token is no longer available'})
    }
    // Token Verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password -verificationToken')
    if(!user) {
      return res.status(401).json({error: 'User belonging to this token no longer exists'})
    }
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Internal server error during authentication' });
  }    
}

// USER REGISTRATION ENDPOINT
app.post('/api/register', async (req, res) => {
  const {email, password} = req.body
  if(!email || !password) {
    return res.status(400).json({error: 'Email and password are required'})
  }
  try {
    const existingUser = await User.findOne({ email })
    if(existingUser){
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const finalVerificationToken = verificationToken.randomBytes(32).toString('hex')
    const newUser = new User({ email, password , finalVerificationToken})
    sendVerificationEmail(newUser.email, finalVerificationToken)

    res.status(201).json({ 
      message: 'User registered successfully. Please verify your email.',
      userId: newUser._id
    })

  }
  catch (error) {
    if(error.name === 'ValidationError') {
     const error = Object.values(error.errors).map(er => er.message) 
     return res.status(400).json({ error: errors.join(', ') });
    }
    console.error('Error during user registration:', error)
    res.status(500).json({ error: 'Internal server error' });
  }
})