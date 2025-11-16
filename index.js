// server.js
// IMPORTANT: This must be the very first line to load .env variables
require('dotenv').config(); 

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

// Initialize the Express app
const app = express();
// Use port from environment or default to 5001
const PORT = process.env.PORT || 5001; 

// --- Middleware ---

// Configure CORS to allow communication from your frontend
app.use(cors({
    // IMPORTANT: Update this to your React app's URL when deploying
    origin: 'https://portfolio-shahid-frontend.vercel.app/' 
}));

app.use(express.json());

// --- Nodemailer Transporter Setup ---
// Use environment variables for secure authentication
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, // Your sending email address
        pass: process.env.EMAIL_PASS, // Your Google App Password (crucial!)
    },
});

// Verify the transporter connection (good practice)
transporter.verify((error, success) => {
    if (error) {
        console.error('Error with Nodemailer transporter. Check EMAIL_USER and EMAIL_PASS in .env. Full error:', error);
    } else {
        console.log('Nodemailer is ready to send emails. Server port:', PORT);
    }
});


// --- API Routes ---

// @route   POST /api/contact
// @desc    Receive contact form data and send an email
// @access  Public
app.post('/api/contact', async (req, res) => {
    // Destructure the form data from the request body
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ msg: 'Please enter all fields (Name, Email, and Message).' });
    }

    // Define the email options
    const mailOptions = {
        // Sender's name and email, using the contact form user's email as the reply-to
        from: `"${name} (via Portfolio Form)" <${process.env.EMAIL_USER}>`, 
        replyTo: email, // This allows you to reply directly to the sender
        to: process.env.EMAIL_USER,    // Your email address (where you'll receive the message)
        subject: `New Portfolio Contact from ${name}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #4f46e5;">New Message from Portfolio Contact Form</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <hr style="border-top: 1px solid #ccc;">
                <h3>Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
            </div>
        `,
    };

    try {
        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        // Send a success response
        res.status(200).json({ msg: 'Thank you for your message! I will get back to you soon.' });
    } catch (error) {
        console.error('Error sending email:', error);
        // Send a server error response
        res.status(500).json({ msg: 'Sorry, there was an error sending your message. Please verify your .env settings.' });
    }
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});