const User = require('../models/user')
const auth = require('../middleware/auth')
const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')
const router = new express.Router()

// USER ENDPOINTS
// log a user in
router.post('/users/login', async (req, res) => {
    try {
        // find user using email and password and generate a new auth token
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

// log a user out by wiping the current auth token if authenticated
router.post('/users/logout', auth, async (req, res) => {
    try {
        // remove current token from array of tokens to logout
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// log a user out by clearing all active auth tokens if authenticated
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        // empty user tokens array to clear all auth tokens
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// create a new user 
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        // generate an auth token to log the user in after signing up
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

// get authenticated users' profile (own profile)
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// update current user profile if authenticated
router.patch('/users/me', auth, async (req, res) => {
    // check what user wants to update and what is allowed to be updated, then compare to check whether the operation is valid
    // Object.keys converts an object into an array of strings, where each is a property of the object
    const updates = Object.keys(req.body)
    const allowedUpdates =  ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        // iterate through each field and update them to match the object sent in the request
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// delete own user profile, if authenticated
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

// configure multer to allow uploading pictures
const upload = multer({
    // set 1MB max filesize limit - N.B fileSize is in bytes
    limits: {
        fileSize: 1000000
    },
    // filter to only allow files that end in .jpg, .jpeg or .png using regex
    // N.B - cb is callback, use to return error
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload a jpg, jpeg or png file'))
        }
        // output success case, failing case without error msg would be `cb(undefined, false)`
        cb(undefined, true)
    },
})

// upload a user profile picture if authenticated
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    // resize image to a uniform size then convert data back to a png buffer to be able to modify it
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

    // set user avatar value to value of buffer const then save
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error : error.message })
})

// delete the user profile picture if authenticated
router.delete('/users/me/avatar', auth, async (req, res) => {
    // mongoose will not store an undefined value, so we can set req.user.avatar to undefined to delete
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

// get a users profile picture by id
router.get('/users/:id/avatar', async (req, res) => {
    try {
        // look for a user by id, if the user does not exist or if the user does not have a profile pic, throw an error
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }
        
        // set response header - content type is an image of type .png
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router
