const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

// TASK ENDPOINTS
// create a new task
router.post('/tasks', auth, async (req, res) => {
    // spread operator (...), matches req.body fields to task fields
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// GET /tasks?completed=false | /tasks?limit=2&skip=2 | /tasks?sortBy=asc
// get all tasks that the user has created
router.get('/tasks', auth, async (req, res) => {
    // create empty objects in case no results are returned
    const match = {}
    const sort = {}

    // check if there is a query input for completed, then whether input is 'true' or 'false'
    // N.B - req.query.completed is a string, not a boolean
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    // check if there is a query input for sortBy, then whether it is 1 or -1
    if (req.query.sortBy) {
        // use string splitting to extract how we want tasks to be sorted
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    
    try {
        // populate req.user.tasks with users' tasks, with customisations from 
        // 'match' and 'options' objects then send the result
        await req.user.populate({
            path: 'tasks', 
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(400).send(e)
    }
})

// get one of the users' created tasks by id
router.get('/tasks/:id', auth, async (req, res) => {
    // req.params id => :id in route
    const _id = req.params.id

    try {
        // ensure only tasks that the user owns is shown by checking the id is equal to id in req.params.id and
        // that the owner field is the same as req.user._id (obtained from auth.js) 
        // LINK practice-projects/task-manager/src/middleware/auth.js#auth-anchor
        const task = await Task.findOne({ _id, owner: req.user._id})
        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch(e) {
        res.status(500).send()
    }
})

// update a task that the user owns
router.patch('/tasks/:id', auth, async (req, res) => {
    // check what user wants to update and what is allowed to be updated, then compare to check whether the operation is valid
    // Object.keys converts an object into an array of strings, where each is a property of the object
    const updates = Object.keys(req.body) 
    const allowedUpdates =  ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }
    
    try {
        // find task to update using id, and check whether the owner is requesting to update
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id})
        
        // send 404 if task is not found, or user trying to access it is not the owner
        if (!task) {
            return res.status(404).send()
        }

        // iterate through each field and update them to match the object sent in the request
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// delete a task that the user owns
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        // find and delete the task using id, and by checking owner matches user id
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        
        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router
