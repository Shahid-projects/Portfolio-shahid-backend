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

// Configure CORS to allow communication from your Vercel frontend
// Note: We include an array of allowed origins to handle potential protocol/trailing slash differences
const allowedOrigins = [
    // Your Vercel production domain (without trailing slash)
    'https://portfolio-shahid-frontend.vercel.app',
    // Local development environment
    'http://localhost:5173',
    'http://localhost:5001' 
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // Check if the origin is in the allowed list
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

app.use(express.json());

// --- Nodemailer Transporter Setup ---
// Uses environment variables set on the hosting platform (e.g., Render)
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
        console.error('Nodemailer Setup Error: Check EMAIL_USER/EMAIL_PASS on hosting platform. Full error:', error);
    } else {
        console.log('Nodemailer is ready to send emails. Server port:', PORT);
    }
});


// --- API Routes ---

// @route   POST /api/contact
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ msg: 'Please enter all fields (Name, Email, and Message).' });
    }

    const mailOptions = {
        from: `"${name} (via Portfolio Form)" <${process.env.EMAIL_USER}>`, 
        replyTo: email, // Reply will go to the person who filled out the form
        to: process.env.EMAIL_USER,    // This is YOUR email (where you receive the contact)
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
        await transporter.sendMail(mailOptions);
        res.status(200).json({ msg: 'Thank you for your message! I will get back to you soon.' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ msg: 'Sorry, the message could not be sent. Please check server logs for Nodemailer error.' });
    }
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});