// logic to automate email sending
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// function to send a welcome email when a new user signs up
const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'djimee1@sheffield.ac.uk',
        subject: 'Welcome to the app!',
        text: `Hi ${name}!`
    })
}

// function to send a cancellation email when a user cancels their account
const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'djimee1@sheffield.ac.uk',
        subject: 'Sorry to see you go',
        text: `Bye bye ${name}!`
    })
}

// export to use in user router
module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}
