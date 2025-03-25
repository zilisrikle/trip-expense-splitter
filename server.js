const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB连接URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tianyihan99:VuvpeTfweyVWEi81@cluster0.mongodb.net/trip-expenses?retryWrites=true&w=majority';
const dbName = 'trip-expenses';

let db;

// 连接到MongoDB
async function connectToMongo() {
    try {
        const client = await MongoClient.connect(MONGODB_URI);
        db = client.db(dbName);
        console.log('Connected to MongoDB');
        
        // 确保集合和索引存在
        await db.collection('expenses').createIndex({ date: 1 });
        await db.collection('participants').createIndex({ name: 1 });
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

connectToMongo();

// API路由
app.get('/api/participants', async (req, res) => {
    try {
        const participants = await db.collection('participants').find().toArray();
        res.json(participants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/participants', async (req, res) => {
    try {
        const result = await db.collection('participants').insertOne({
            name: req.body.name,
            createdAt: new Date()
        });
        res.json({ id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/participants/:id', async (req, res) => {
    try {
        await db.collection('participants').deleteOne({
            _id: new ObjectId(req.params.id)
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/expenses', async (req, res) => {
    try {
        const query = {};
        if (req.query.participant) {
            query['participants.userId'] = parseInt(req.query.participant);
        }
        if (req.query.type) {
            query.type = req.query.type;
        }
        if (req.query.startDate || req.query.endDate) {
            query.date = {};
            if (req.query.startDate) {
                query.date.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                query.date.$lte = new Date(req.query.endDate);
            }
        }
        
        const expenses = await db.collection('expenses')
            .find(query)
            .sort({ date: -1 })
            .toArray();
        
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/expenses', async (req, res) => {
    try {
        const expense = {
            ...req.body,
            date: new Date(req.body.date),
            createdAt: new Date()
        };
        const result = await db.collection('expenses').insertOne(expense);
        res.json({ id: result.insertedId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    try {
        await db.collection('expenses').deleteOne({
            _id: new ObjectId(req.params.id)
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 所有其他路由返回index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
