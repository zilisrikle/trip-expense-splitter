const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage
let expenses = [];

// Currency exchange rates
const exchangeRates = {
    CNY: 1,
    USD: 7.2,
    VND: 0.0003,
    THB: 0.2,
    NPR: 0.06,
    MYR: 1.5,
    SGD: 5.3,
    KRW: 0.0054,
    JPY: 0.048
};

// Helper function to convert to CNY
function convertToCNY(amount, currency) {
    return amount * exchangeRates[currency];
}

// API Routes
app.post('/api/expenses', (req, res) => {
    const expense = {
        ...req.body,
        id: expenses.length + 1,
        date: new Date()
    };
    expenses.push(expense);
    res.json(expense);
});

app.get('/api/expenses', (req, res) => {
    let filteredExpenses = [...expenses];
    
    // Apply filters
    if (req.query.userId) {
        const userId = parseInt(req.query.userId);
        filteredExpenses = filteredExpenses.filter(e => 
            e.payerId === userId || e.participants.some(p => p.userId === userId)
        );
    }
    
    if (req.query.type) {
        filteredExpenses = filteredExpenses.filter(e => e.type === req.query.type);
    }
    
    if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        filteredExpenses = filteredExpenses.filter(e => new Date(e.date) >= startDate);
    }
    
    if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        filteredExpenses = filteredExpenses.filter(e => new Date(e.date) <= endDate);
    }
    
    res.json(filteredExpenses);
});

app.get('/api/settlements', (req, res) => {
    // Calculate balances for each member
    const balances = new Map();
    
    // Process all expenses
    expenses.forEach(expense => {
        const totalInCNY = convertToCNY(expense.amount, expense.currency);
        
        // Add payment amount to payer's balance
        const payerId = expense.payerId;
        balances.set(payerId, (balances.get(payerId) || 0) + totalInCNY);
        
        // Subtract shares from participants' balances
        expense.participants.forEach(participant => {
            const shareInCNY = convertToCNY(participant.share, expense.currency);
            balances.set(participant.userId, (balances.get(participant.userId) || 0) - shareInCNY);
        });
    });
    
    // Convert balances to array format
    const balanceArray = Array.from(balances.entries()).map(([userId, balance]) => ({
        userId,
        balance: parseFloat(balance.toFixed(2))
    }));
    
    // Calculate optimal settlements
    const settlements = calculateOptimalSettlements(balanceArray);
    
    res.json({
        balances: balanceArray,
        settlements
    });
});

function calculateOptimalSettlements(balances) {
    const settlements = [];
    const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debt = Math.abs(debtors[i].balance);
        const credit = creditors[j].balance;
        const amount = Math.min(debt, credit);
        
        if (amount > 0.01) { // Only add settlement if amount is significant
            settlements.push({
                from: debtors[i].userId,
                to: creditors[j].userId,
                amount: parseFloat(amount.toFixed(2))
            });
        }
        
        debtors[i].balance += amount;
        creditors[j].balance -= amount;
        
        if (Math.abs(debtors[i].balance) < 0.01) i++;
        if (Math.abs(creditors[j].balance) < 0.01) j++;
    }
    
    return settlements;
}

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
