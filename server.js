const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
const MONGODB_URI = 'mongodb://localhost:27017/budget_allocation_db';

console.log('Attempting to connect to MongoDB at:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB successfully');
    
    // Start server only after successful MongoDB connection
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`API endpoints available at http://localhost:${PORT}/api/`);
    });
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
    console.error('Error details:', {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack
    });
    process.exit(1);
});

// Define MongoDB Schema
const voteSchema = new mongoose.Schema({
    sector: {
        type: String,
        required: true,
        enum: ['healthcare', 'education', 'infrastructure', 'agriculture', 'defense', 'social_welfare']
    },
    amount: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true,
        enum: ['healthcare', 'education', 'infrastructure', 'agriculture', 'defense', 'social_welfare', 'other']
    },
    satisfaction: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create models
const Vote = mongoose.model('Vote', voteSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

// API Routes
// Get all votes
app.get('/api/votes', async (req, res) => {
    try {
        const votes = await Vote.find();
        res.json(votes);
    } catch (err) {
        console.error('Error fetching votes:', err);
        res.status(500).json({ message: err.message });
    }
});

// Create new vote
app.post('/api/votes', async (req, res) => {
    const vote = new Vote({
        sector: req.body.sector,
        amount: req.body.amount
    });

    try {
        const newVote = await vote.save();
        res.status(201).json(newVote);
    } catch (err) {
        console.error('Error creating vote:', err);
        res.status(400).json({ message: err.message });
    }
});

// Get sector-wise vote count
app.get('/api/sector-votes', async (req, res) => {
    try {
        const sectorVotes = await Vote.aggregate([
            {
                $group: {
                    _id: '$sector',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);
        res.json(sectorVotes);
    } catch (err) {
        console.error('Error getting sector votes:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get all feedback
app.get('/api/feedback', async (req, res) => {
    try {
        const feedback = await Feedback.find();
        res.json(feedback);
    } catch (err) {
        console.error('Error fetching feedback:', err);
        res.status(500).json({ message: err.message });
    }
});

// Submit new feedback
app.post('/api/feedback', async (req, res) => {
    const feedback = new Feedback({
        name: req.body.name,
        email: req.body.email,
        message: req.body.message,
        topic: req.body.topic,
        satisfaction: req.body.satisfaction
    });

    try {
        const newFeedback = await feedback.save();
        res.status(201).json(newFeedback);
    } catch (err) {
        console.error('Error creating feedback:', err);
        res.status(400).json({ message: err.message });
    }
});

// Get feedback analytics
app.get('/api/feedback-analytics', async (req, res) => {
    try {
        const totalFeedback = await Feedback.countDocuments();
        const averageSatisfaction = await Feedback.aggregate([
            {
                $group: {
                    _id: null,
                    avgSatisfaction: { $avg: '$satisfaction' }
                }
            }
        ]);
        
        const topicDistribution = await Feedback.aggregate([
            {
                $group: {
                    _id: '$topic',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            totalFeedback,
            averageSatisfaction: averageSatisfaction[0]?.avgSatisfaction || 0,
            topicDistribution
        });
    } catch (err) {
        console.error('Error getting feedback analytics:', err);
        res.status(500).json({ message: err.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Test MongoDB Connection
app.get('/api/test-mongodb', async (req, res) => {
    try {
        // Test connection by creating a test document
        const testVote = new Vote({
            sector: 'test',
            amount: 100
        });
        
        await testVote.save();
        
        // Verify we can read the document
        const savedVote = await Vote.findOne({ sector: 'test' });
        
        // Clean up test data
        await Vote.deleteOne({ sector: 'test' });
        
        res.json({
            status: 'success',
            message: 'MongoDB connection test successful',
            testData: savedVote,
            connectionStatus: {
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name
            }
        });
    } catch (error) {
        console.error('MongoDB test error:', error);
        res.status(500).json({
            status: 'error',
            message: 'MongoDB connection test failed',
            error: error.message
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
}); 