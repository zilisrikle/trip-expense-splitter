// Global state
let participants = [];

// Currency exchange rates (would be fetched from API in production)
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

// Initialize the application
async function initApp() {
    await loadParticipants();
    await loadExpenses();
    updateUI();
}

// Load participants from API
async function loadParticipants() {
    try {
        const response = await fetch('/api/participants');
        participants = await response.json();
        updateParticipantsList();
    } catch (error) {
        console.error('Error loading participants:', error);
        showError('加载成员数据失败');
    }
}

// Load expenses from API
async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        const expenses = await response.json();
        updateExpensesList(expenses);
        updateStatistics(expenses);
    } catch (error) {
        console.error('Error loading expenses:', error);
        showError('加载费用数据失败');
    }
}

// Add new participant
async function addParticipant(name) {
    try {
        const response = await fetch('/api/participants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        const result = await response.json();
        await loadParticipants();
        return result.id;
    } catch (error) {
        console.error('Error adding participant:', error);
        showError('添加成员失败');
        return null;
    }
}

// Delete participant
async function deleteParticipant(id) {
    try {
        await fetch(`/api/participants/${id}`, {
            method: 'DELETE'
        });
        await loadParticipants();
    } catch (error) {
        console.error('Error deleting participant:', error);
        showError('删除成员失败');
    }
}

// Add new expense
async function addExpense(expenseData) {
    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });
        const result = await response.json();
        await loadExpenses();
        return result.id;
    } catch (error) {
        console.error('Error adding expense:', error);
        showError('添加费用失败');
        return null;
    }
}

// Delete expense
async function deleteExpense(id) {
    try {
        await fetch(`/api/expenses/${id}`, {
            method: 'DELETE'
        });
        await loadExpenses();
    } catch (error) {
        console.error('Error deleting expense:', error);
        showError('删除费用失败');
    }
}

// Update UI display
function updateUI() {
    updateParticipantsList();
    updateExpensesList([]);
    updateStatistics([]);
}

// Update participants list display
function updateParticipantsList() {
    const participantsList = document.getElementById('participantsList');
    if (!participantsList) return;

    participantsList.innerHTML = participants.map(p => `
        <div class="participant-item">
            <span>${p.name}</span>
            <button onclick="deleteParticipant('${p._id}')">删除</button>
        </div>
    `).join('');

    // Update add expense form's participant select
    const payerSelect = document.getElementById('expensePayer');
    if (payerSelect) {
        payerSelect.innerHTML = participants.map(p => 
            `<option value="${p._id}">${p.name}</option>`
        ).join('');
    }
}

// Update expenses list display
function updateExpensesList(expenses) {
    const expensesList = document.getElementById('expensesList');
    if (!expensesList) return;

    expensesList.innerHTML = expenses.map(e => {
        const payer = participants.find(p => p._id === e.payerId);
        return `
            <div class="expense-item">
                <div class="expense-info">
                    <span class="expense-description">${e.description}</span>
                    <span class="expense-amount">${e.amount} ${e.currency}</span>
                    <span class="expense-payer">支付者: ${payer ? payer.name : '未知'}</span>
                    <span class="expense-date">${new Date(e.date).toLocaleDateString()}</span>
                </div>
                <button onclick="deleteExpense('${e._id}')">删除</button>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStatistics(expenses) {
    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate each person's expenses and balance
    const balances = new Map();
    participants.forEach(p => balances.set(p._id, 0));
    
    expenses.forEach(expense => {
        const payer = participants.find(p => p._id === expense.payerId);
        if (payer) {
            balances.set(payer._id, balances.get(payer._id) + expense.amount);
        }
        
        // Calculate each participant's share
        const shareAmount = expense.amount / expense.participants.length;
        expense.participants.forEach(participantId => {
            balances.set(participantId, balances.get(participantId) - shareAmount);
        });
    });
    
    // Update statistics display
    const statsDiv = document.getElementById('statistics');
    if (statsDiv) {
        statsDiv.innerHTML = `
            <h3>统计信息</h3>
            <p>总支出: ${totalExpenses.toFixed(2)} CNY</p>
            <h4>个人收支情况:</h4>
            ${Array.from(balances.entries()).map(([id, balance]) => {
                const participant = participants.find(p => p._id === id);
                return `<p>${participant ? participant.name : '未知'}: ${balance.toFixed(2)} CNY</p>`;
            }).join('')}
        `;
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

// Handle add expense form submission
function handleAddExpense(event) {
    event.preventDefault();
    
    const description = document.getElementById('expenseDescription').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const currency = document.getElementById('expenseCurrency').value;
    const payerId = document.getElementById('expensePayer').value;
    const date = document.getElementById('expenseDate').value;
    
    // Get selected participants
    const participantCheckboxes = document.querySelectorAll('input[name="expenseParticipants"]:checked');
    const participants = Array.from(participantCheckboxes).map(cb => cb.value);
    
    if (!description || !amount || !currency || !payerId || !date || participants.length === 0) {
        showError('请填写所有必要信息');
        return;
    }
    
    const expenseData = {
        description,
        amount,
        currency,
        payerId,
        date,
        participants,
        type: document.getElementById('expenseType').value
    };
    
    addExpense(expenseData);
    event.target.reset();
}

// Handle add participant form submission
function handleAddParticipant(event) {
    event.preventDefault();
    const name = document.getElementById('participantName').value;
    if (name) {
        addParticipant(name);
        event.target.reset();
    }
}

// Initialize application when page loads
document.addEventListener('DOMContentLoaded', initApp);

// Add event listeners to forms
document.getElementById('addExpenseForm')?.addEventListener('submit', handleAddExpense);
document.getElementById('addParticipantForm')?.addEventListener('submit', handleAddParticipant);
