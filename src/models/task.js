const mongoose = require('mongoose')
const validator = require('validator')

// create task schema
const taskSchema = mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    // set owner to have type of Object ID (needed to query 
    // mongoose), and to have a reference to User model
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    // have created_at and updated_at fields set automatically
    timestamps: true
})

// use schema created to create Task model
const Task = mongoose.model('Task', taskSchema)

module.exports = Task
