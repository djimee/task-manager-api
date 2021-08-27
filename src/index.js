require('./db/mongoose')
const express = require('express')

// require the routers created
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

// create app and set the port - process.env.PORT is used for Heroku deployment
const app = express()
const port = process.env.PORT

// use express.json() to parse incoming JSON to a JS object, accessible on req.body
app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

// start the server with the port we want to listen on
app.listen(port, () => {
    console.log('Server running on port: ' + port)
})
