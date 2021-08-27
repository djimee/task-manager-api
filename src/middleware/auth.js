const jwt = require('jsonwebtoken')
const User = require('../models/user')

// function to authorise user using the generate auth token and token secret
const auth = async (req, res, next) => {
    try {
        // verify token by finding a user with the id and token given
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // N.B. 'tokens.token' is syntax used to query an array of objects
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        
        // check if the user exists, otherwise throw an error
        if (!user) {
            throw new Error()
        }

        // ANCHOR [id=auth-anchor] 
        // user authenticated - store user in request and run route handler by using next()
        req.token = token
        req.user = user
        next()

    } catch (e) {
        res.status(401).send({ error: 'Please authenticate.'})
    }
}

module.exports = auth
