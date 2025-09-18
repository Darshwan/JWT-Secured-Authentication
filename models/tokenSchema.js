import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
}
)

tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
