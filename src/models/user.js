const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

// create user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('The word "password" cannot be in password')
            }
        }
    },
    // allow user to have an array of token objects - user can login multiple times
    // e.g across different devices
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    // set avatar to be of type Buffer - allows us to store avatar as binary data
    avatar: {
        type: Buffer
    }
// have created_at and updated_at fields set automatically
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    // stop showing user hashed password, tokens and avatar when sending a request
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    // ANCHOR [id=JWT-anchor] 
    // JWT token is created here, and token secret is set here
    const token = jwt.sign({ _id: user.id.toString() }, process.env.JWT_SECRET)

    // concatenate user token, to tokens array in model, then save
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// hash plaintext password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })

    next()  
})

const User = mongoose.model('User', userSchema)

module.exports = User
