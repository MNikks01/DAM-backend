import express from 'express';

// Create a mock express app for testing
const mockApp = express();
mockApp.use(express.json());

// Add basic routes for testing
mockApp.post('/api/v1/users/register', (req, res) => {
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { email: req.body.email, name: req.body.name }
    });
});

mockApp.post('/api/v1/users/login', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { email: req.body.email }
    });
});

export default mockApp;