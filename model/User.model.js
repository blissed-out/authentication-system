import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
    name: {
        type: "String",
        unique: true,
        required: true
    },
    email: {
        type: "String",
        unique: true,
        required: true
    },
    password: {
        type: "String",
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        default: undefined
    },
    forgetPasswordToken: {
        type: String,
        default: undefined
    },
    resetPasswordToken: {
        type: String,
        default: undefined
    }
}, { timestamps: true })

// hash the user's password
userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

const User = mongoose.model('User', userSchema);

export default User;
