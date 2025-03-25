// Global state
let participants = [
    { id: 1, name: '成员1' },
    { id: 2, name: '成员2' },
    { id: 3, name: '成员3' },
    { id: 4, name: '成员4' }
];

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
document.addEventListener('DOMContentLoaded', () => {
    loadParticipants();
    initializeParticipantsList();
    initializePayerSelect();
    initializeMemberFilter();
    initializeCharts();  
    loadExpenses();
    updateOverview();

    // Add event listener for amount changes
    document.getElementById('expenseAmount').addEventListener('input', updateParticipantShares);
    document.getElementById('expenseCurrency').addEventListener('change', updateParticipantShares);

    // Add member management button to header
    const header = document.querySelector('header');
    const memberButton = document.createElement('button');
    memberButton.className = 'apple-button bg-[#5856D6] text-white px-4 py-2 mt-4';
    memberButton.innerHTML = '<i class="ri-user-settings-line mr-2"></i>成员管理';
    memberButton.onclick = showMemberModal;
    header.appendChild(memberButton);
});

// Member Management Functions
function showMemberModal() {
    const modal = document.getElementById('memberModal');
    modal.classList.add('show');
    populateMemberList();
}

function hideMemberModal() {
    const modal = document.getElementById('memberModal');
    modal.classList.remove('show');
}

function populateMemberList() {
    const container = document.getElementById('memberList');
    container.innerHTML = participants.map(p => `
        <div class="flex items-center space-x-2">
            <input type="text" 
                   class="apple-input flex-1" 
                   value="${p.name}" 
                   id="member_name_${p.id}"
                   placeholder="成员名称">
            ${participants.length > 2 ? `
                <button onclick="removeMember(${p.id})" 
                        class="apple-button bg-[#FF3B30] text-white p-2">
                    <i class="ri-delete-bin-line"></i>
                </button>
            ` : ''}
        </div>
    `).join('');
}

function addNewMember() {
    const newId = Math.max(...participants.map(p => p.id)) + 1;
    participants.push({ id: newId, name: `成员${newId}` });
    populateMemberList();
}

function removeMember(id) {
    participants = participants.filter(p => p.id !== id);
    populateMemberList();
}

function saveMemberChanges() {
    participants = participants.map(p => ({
        ...p,
        name: document.getElementById(`member_name_${p.id}`).value || p.name
    }));
    
    // Save to localStorage
    localStorage.setItem('participants', JSON.stringify(participants));
    
    // Update UI
    initializeParticipantsList();
    initializePayerSelect();
    initializeMemberFilter();
    
    // Reload expenses to reflect new names
    loadExpenses();
    loadSettlements();
    
    hideMemberModal();
}

function loadParticipants() {
    const saved = localStorage.getItem('participants');
    if (saved) {
        participants = JSON.parse(saved);
    }
}

// UI Functions
function showAddExpenseModal() {
    document.getElementById('addExpenseModal').classList.remove('hidden');
    document.getElementById('addExpenseModal').classList.add('flex');
    updateParticipantShares();
}

function hideAddExpenseModal() {
    document.getElementById('addExpenseModal').classList.remove('flex');
    document.getElementById('addExpenseModal').classList.add('hidden');
    document.getElementById('expenseForm').reset();
    initializeParticipantsList();
}

function initializeParticipantsList() {
    const container = document.getElementById('participantsList');
    container.innerHTML = participants.map(p => `
        <div class="flex items-center justify-between p-2 hover:bg-gray-100 rounded" id="participant_row_${p.id}">
            <div class="flex items-center flex-1">
                <input type="checkbox" name="participant_${p.id}" id="participant_${p.id}" 
                       class="w-4 h-4 text-blue-600 participant-checkbox" checked
                       onchange="updateParticipantShares()">
                <label for="participant_${p.id}" class="ml-2 flex-1">${p.name}</label>
            </div>
            <div class="flex items-center space-x-2 flex-1">
                <input type="number" 
                       id="share_${p.id}" 
                       class="apple-input w-full text-right participant-share"
                       step="0.01" 
                       value="0.00"
                       onchange="validateShare(${p.id})"
                       onfocus="this.select()">
            </div>
        </div>
    `).join('');
}

function initializePayerSelect() {
    const select = document.getElementById('payerSelect');
    select.innerHTML = participants.map(p => `
        <option value="${p.id}">${p.name}</option>
    `).join('');
}

function validateShare(participantId) {
    const totalAmount = parseFloat(document.getElementById('expenseAmount').value) || 0;
    const shareInput = document.getElementById(`share_${participantId}`);
    let shareAmount = parseFloat(shareInput.value) || 0;
    
    // Ensure share is not negative
    if (shareAmount < 0) {
        shareAmount = 0;
        shareInput.value = '0.00';
    }
    
    // Ensure share is not more than total
    if (shareAmount > totalAmount) {
        shareAmount = totalAmount;
        shareInput.value = totalAmount.toFixed(2);
    }
    
    updateParticipantShares();
}

function updateParticipantShares() {
    const totalAmount = parseFloat(document.getElementById('expenseAmount').value) || 0;
    let totalShares = 0;
    
    // Calculate total of manually entered shares
    participants.forEach(p => {
        const shareInput = document.getElementById(`share_${p.id}`);
        const isParticipating = document.getElementById(`participant_${p.id}`).checked;
        if (shareInput && isParticipating) {
            totalShares += parseFloat(shareInput.value) || 0;
        }
    });
    
    // Update validation status
    const submitButton = document.querySelector('#expenseForm button[type="submit"]');
    const isValid = Math.abs(totalAmount - totalShares) < 0.01;
    submitButton.disabled = !isValid;
    
    // Visual feedback
    const totalDisplay = document.getElementById('totalSharesDisplay');
    if (totalDisplay) {
        totalDisplay.textContent = `总计: ${totalAmount.toFixed(2)}`;
        totalDisplay.className = isValid ? 'text-green-600' : 'text-red-600';
    }
}

function initializeMemberFilter() {
    const select = document.getElementById('memberFilter');
    select.innerHTML = '<option value="">所有成员</option>' + participants.map(p => `
        <option value="${p.id}">${p.name}</option>
    `).join('');
}

// Currency conversion
function convertToCNY(amount, currency) {
    return amount * exchangeRates[currency];
}

// API Calls
async function addExpense(data) {
    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error('Error adding expense:', error);
        throw error;
    }
}

async function loadExpenses() {
    try {
        const memberFilter = document.getElementById('memberFilter').value;
        const typeFilter = document.getElementById('filterType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        let url = '/api/expenses?';
        if (memberFilter) url += `userId=${memberFilter}&`;
        if (typeFilter) url += `type=${typeFilter}&`;
        if (startDate) url += `startDate=${startDate}&`;
        if (endDate) url += `endDate=${endDate}&`;

        const response = await fetch(url);
        const expenses = await response.json();
        displayExpenses(expenses);
        updateCharts(expenses);
        updateOverview();
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

async function loadSettlements() {
    try {
        const response = await fetch('/api/settlements');
        const data = await response.json();
        displaySettlements(data.settlements);
        displayMemberBalances(data.balances);
    } catch (error) {
        console.error('Error loading settlements:', error);
    }
}

// Display Functions
function displayExpenses(expenses) {
    const container = document.getElementById('expenseList');
    container.innerHTML = expenses.map(expense => `
        <div class="apple-card p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center space-x-2">
                        <span class="text-lg font-semibold">${expense.type}</span>
                        <span class="text-sm text-gray-500">${new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                    <div class="text-sm text-gray-600 mt-1">
                        <span>支付方式: ${expense.payment_method}</span>
                        <span class="mx-2">·</span>
                        <span>支付人: ${participants.find(p => p.id === expense.payerId)?.name}</span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-[#007AFF]">
                        ${formatCurrency(expense.amount, expense.currency)}
                    </div>
                    <div class="text-sm text-gray-500">
                        ≈ ¥${(convertToCNY(expense.amount, expense.currency)).toFixed(2)}
                    </div>
                </div>
            </div>
            <div class="mt-3 pt-3 border-t text-sm space-y-1">
                <div class="font-medium text-gray-700">分摊明细:</div>
                ${expense.participants.map(p => `
                    <div class="flex justify-between text-gray-600">
                        <span>${participants.find(part => part.id === p.userId)?.name}</span>
                        <span>${formatCurrency(p.share, expense.currency)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function displayMemberBalances(balances) {
    const container = document.getElementById('memberBalances');
    container.innerHTML = balances.map(balance => {
        const member = participants.find(p => p.id === balance.userId);
        return `
            <div class="flex justify-between items-center p-3 border-b last:border-0">
                <span class="font-medium">${member ? member.name : `成员${balance.userId}`}</span>
                <span class="font-semibold ${balance.balance >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}">
                    ¥${Math.abs(balance.balance).toFixed(2)}
                    ${balance.balance >= 0 ? '应收' : '应付'}
                </span>
            </div>
        `;
    }).join('');
}

function displaySettlements(settlements) {
    const container = document.getElementById('settlementList');
    container.innerHTML = settlements.map(settlement => {
        const fromMember = participants.find(p => p.id === settlement.from);
        const toMember = participants.find(p => p.id === settlement.to);
        return `
            <div class="flex items-center justify-between p-3 border-b last:border-0">
                <div class="flex items-center space-x-2">
                    <span class="font-medium">${fromMember ? fromMember.name : `成员${settlement.from}`}</span>
                    <i class="ri-arrow-right-line text-gray-400"></i>
                    <span class="font-medium">${toMember ? toMember.name : `成员${settlement.to}`}</span>
                </div>
                <span class="font-semibold text-[#007AFF]">¥${settlement.amount.toFixed(2)}</span>
            </div>
        `;
    }).join('');
}

function formatCurrency(amount, currency) {
    const symbols = {
        CNY: '¥',
        USD: '$',
        VND: '₫',
        THB: '฿',
        NPR: 'रू',
        MYR: 'RM',
        SGD: 'S$',
        KRW: '₩',
        JPY: '¥'
    };
    return `${symbols[currency]}${amount.toFixed(2)}`;
}

async function updateOverview() {
    try {
        // 获取所有费用
        const response = await fetch('/api/expenses');
        const expenses = await response.json();
        
        // 计算总费用（转换为人民币）
        const totalInCNY = expenses.reduce((sum, expense) => {
            return sum + convertToCNY(expense.amount, expense.currency);
        }, 0);
        
        // 更新总费用显示
        document.getElementById('totalExpense').textContent = `¥${totalInCNY.toFixed(2)}`;
        
        // 计算人均费用
        const averageInCNY = participants.length > 0 ? totalInCNY / participants.length : 0;
        document.getElementById('averageExpense').textContent = `¥${averageInCNY.toFixed(2)}`;
        
        // 计算每个成员的总支出和支付金额
        const memberStats = new Map();
        participants.forEach(p => {
            memberStats.set(p.id, {
                name: p.name,
                paid: 0,      // 已支付金额
                share: 0,     // 应承担金额
                expenses: []  // 参与的费用列表
            });
        });
        
        // 统计每个成员的支付和分摊情况
        expenses.forEach(expense => {
            const paidAmount = convertToCNY(expense.amount, expense.currency);
            const stats = memberStats.get(expense.payerId);
            if (stats) {
                stats.paid += paidAmount;
                stats.expenses.push({
                    type: expense.type,
                    amount: paidAmount,
                    date: expense.date
                });
            }
            
            expense.participants.forEach(p => {
                const shareAmount = convertToCNY(p.share, expense.currency);
                const participantStats = memberStats.get(p.userId);
                if (participantStats) {
                    participantStats.share += shareAmount;
                }
            });
        });
        
        // 更新成员费用概览
        const container = document.getElementById('memberExpenses');
        container.innerHTML = Array.from(memberStats.values()).map(stats => `
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="font-medium">${stats.name}</div>
                    <div class="text-sm text-gray-400">
                        参与${stats.expenses.length}笔支出
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-medium">
                        支付: ¥${stats.paid.toFixed(2)}
                    </div>
                    <div class="text-sm ${stats.paid >= stats.share ? 'text-[#34C759]' : 'text-[#FF3B30]'}">
                        应付: ¥${stats.share.toFixed(2)}
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error updating overview:', error);
    }
}

// Event Listeners
document.getElementById('expenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const selectedParticipants = participants
        .filter(p => document.getElementById(`participant_${p.id}`).checked)
        .map(p => ({
            userId: p.id,
            share: parseFloat(document.getElementById(`share_${p.id}`).value) || 0
        }));

    const expenseData = {
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount')),
        currency: formData.get('currency'),
        paymentMethod: formData.get('paymentMethod'),
        payerId: parseInt(formData.get('payer')),
        participants: selectedParticipants,
        date: new Date().toISOString()  
    };

    try {
        await addExpense(expenseData);
        hideAddExpenseModal();
        loadExpenses();  
        loadSettlements();
    } catch (error) {
        alert('添加费用失败，请重试');
    }
});

// View switching functions
function showExpenseDetails() {
    document.getElementById('expenseDetails').classList.remove('hidden');
    document.getElementById('settlement').classList.add('hidden');
    loadExpenses();
}

function showSettlement() {
    document.getElementById('settlement').classList.remove('hidden');
    document.getElementById('expenseDetails').classList.add('hidden');
    loadSettlements();
}

// Filter handling
document.getElementById('memberFilter').addEventListener('change', loadExpenses);
document.getElementById('filterType').addEventListener('change', loadExpenses);
document.getElementById('startDate').addEventListener('change', loadExpenses);
document.getElementById('endDate').addEventListener('change', loadExpenses);

// 初始化图表
function initializeCharts() {
    // 按类型分布图表
    const expenseTypeCtx = document.getElementById('expenseTypeChart').getContext('2d');
    window.expenseTypeChart = new Chart(expenseTypeCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#0066CC',
                    '#5856D6',
                    '#34C759',
                    '#FF2D55',
                    '#FF9500',
                    '#AF52DE'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#1D1D1F',
                        font: {
                            family: '-apple-system'
                        }
                    }
                }
            }
        }
    });

    // 每日费用趋势图表
    const expenseTrendCtx = document.getElementById('expenseTrendChart').getContext('2d');
    window.expenseTrendChart = new Chart(expenseTrendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '每日支出',
                data: [],
                borderColor: '#0066CC',
                backgroundColor: 'rgba(0, 102, 204, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#86868B',
                        font: {
                            family: '-apple-system'
                        }
                    }
                },
                x: {
                    ticks: {
                        color: '#86868B',
                        font: {
                            family: '-apple-system'
                        }
                    }
                }
            }
        }
    });

    // 支出类型占比饼图
    const expenseTypePieCtx = document.getElementById('expenseTypePieChart').getContext('2d');
    window.expenseTypePieChart = new Chart(expenseTypePieCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#0066CC',
                    '#5856D6',
                    '#34C759',
                    '#FF2D55',
                    '#FF9500',
                    '#AF52DE'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#1D1D1F',
                        font: {
                            family: '-apple-system'
                        }
                    }
                }
            }
        }
    });

    // 每日支出趋势折线图
    const dailyExpenseCtx = document.getElementById('dailyExpenseChart').getContext('2d');
    window.dailyExpenseChart = new Chart(dailyExpenseCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '每日支出',
                data: [],
                borderColor: '#0066CC',
                backgroundColor: 'rgba(0, 102, 204, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#86868B',
                        font: {
                            family: '-apple-system'
                        }
                    }
                },
                x: {
                    ticks: {
                        color: '#86868B',
                        font: {
                            family: '-apple-system'
                        }
                    }
                }
            }
        }
    });
}

// 更新图表数据
function updateCharts(expenses) {
    // 按类型统计费用
    const expensesByType = {};
    const dailyExpenses = {};
    
    expenses.forEach(expense => {
        const amount = convertToCNY(expense.amount, expense.currency);
        
        // 按类型统计
        expensesByType[expense.type] = (expensesByType[expense.type] || 0) + amount;
        
        // 按日期统计
        const date = expense.date.split('T')[0];
        dailyExpenses[date] = (dailyExpenses[date] || 0) + amount;
    });
    
    // 更新类型分布图表
    const types = Object.keys(expensesByType);
    const typeAmounts = types.map(type => expensesByType[type]);
    
    window.expenseTypeChart.data.labels = types;
    window.expenseTypeChart.data.datasets[0].data = typeAmounts;
    window.expenseTypeChart.update();
    
    window.expenseTypePieChart.data.labels = types;
    window.expenseTypePieChart.data.datasets[0].data = typeAmounts;
    window.expenseTypePieChart.update();
    
    // 更新每日趋势图表
    const dates = Object.keys(dailyExpenses).sort();
    const amounts = dates.map(date => dailyExpenses[date]);
    
    window.expenseTrendChart.data.labels = dates;
    window.expenseTrendChart.data.datasets[0].data = amounts;
    window.expenseTrendChart.update();
    
    window.dailyExpenseChart.data.labels = dates;
    window.dailyExpenseChart.data.datasets[0].data = amounts;
    window.dailyExpenseChart.update();
    
    // 更新成员排名
    updateMemberRanking(expenses);
}

// 更新成员排名
function updateMemberRanking(expenses) {
    const memberTotals = {};
    participants.forEach(p => {
        memberTotals[p.id] = {
            name: p.name,
            spent: 0  // 实际承担的费用
        };
    });
    
    expenses.forEach(expense => {
        // 遍历每个费用的参与者
        expense.participants.forEach(participant => {
            const shareAmount = convertToCNY(participant.share, expense.currency);
            if (memberTotals[participant.userId]) {
                memberTotals[participant.userId].spent += shareAmount;
            }
        });
    });
    
    const sortedMembers = Object.values(memberTotals)
        .sort((a, b) => b.spent - a.spent);
    
    const rankingHtml = sortedMembers.map((member, index) => `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <span class="w-6 h-6 flex items-center justify-center ${
                    index < 3 ? 'text-[#0066CC] font-semibold' : 'text-[#86868B]'
                }">${index + 1}</span>
                <span class="ml-2 font-medium">${member.name}</span>
            </div>
            <span class="font-medium">¥${member.spent.toFixed(2)}</span>
        </div>
    `).join('');
    
    document.getElementById('memberRanking').innerHTML = rankingHtml;
}
