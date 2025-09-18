import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address.']
    },
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: [6, 'Password must be at least 6 characters long.']
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
}
)
// Hashing the password before saving the user 
userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next();
    
    this.password = await bcrypt.hash(this.password, 12)
    next()
})
// Instance method to check password candidate
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Create and export the Model
const User = mongoose.model('User', userSchema);
export default User;
