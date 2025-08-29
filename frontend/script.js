// Application State
const state = {
    transactions: [],
    scheduledTransactions: [],
    filteredTransactions: [],
    chart: null,
    nextId: 1
};

// DOM Elements
const elements = {
    totalReceitas: document.getElementById('total-receitas'),
    totalDespesas: document.getElementById('total-despesas'),
    saldoTotal: document.getElementById('saldo-total'),
    transactionForm: document.getElementById('transaction-form'),
    scheduledForm: document.getElementById('scheduled-form'),
    transactionList: document.getElementById('transaction-list'),
    searchInput: document.getElementById('search-transactions'),
    filterType: document.getElementById('filter-type'),
    filterCategory: document.getElementById('filter-category'),
    chartCanvas: document.getElementById('financeChart')
};

// Initialize application
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    loadSampleData();
    setupEventListeners();
    setupTabs();
    initializeChart();
    updateDisplay();
}

function loadSampleData() {
    state.transactions = [
        {
            id: 1,
            description: 'Salário Janeiro',
            amount: 5000.00,
            type: 'receita',
            category: 'salario',
            date: new Date().toISOString().split('T')[0]
        },
        {
            id: 2,
            description: 'Aluguel',
            amount: -1500.00,
            type: 'despesa',
            category: 'moradia',
            date: new Date().toISOString().split('T')[0]
        },
        {
            id: 3,
            description: 'Supermercado',
            amount: -450.00,
            type: 'despesa',
            category: 'alimentacao',
            date: new Date().toISOString().split('T')[0]
        }
    ];
    
    state.scheduledTransactions = [
        {
            id: 4,
            description: 'Internet',
            amount: -89.90,
            type: 'despesa',
            category: 'outros',
            scheduledDate: '2025-09-05',
            repeat: 'monthly',
            isScheduled: true
        }
    ];
    
    state.nextId = 5;
    state.filteredTransactions = [...state.transactions];
}

function setupEventListeners() {
    // Forms
    elements.transactionForm.addEventListener('submit', handleTransactionSubmit);
    elements.scheduledForm.addEventListener('submit', handleScheduledSubmit);

    // Filters
    elements.searchInput.addEventListener('input', applyFilters);
    elements.filterType.addEventListener('change', applyFilters);
    elements.filterCategory.addEventListener('change', applyFilters);

    // Export
    document.getElementById('export-btn').addEventListener('click', exportData);

    // Set minimum date for scheduled transactions to today
    document.getElementById('scheduled-date').min = new Date().toISOString().split('T')[0];
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function initializeChart() {
    const ctx = elements.chartCanvas.getContext('2d');
    
    state.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Receitas', 'Despesas'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#059669', '#dc2626'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transaction = {
        id: state.nextId++,
        description: formData.get('description').trim(),
        amount: parseFloat(formData.get('amount')) * (formData.get('type') === 'despesa' ? -1 : 1),
        type: formData.get('type'),
        category: document.getElementById('category').value,
        date: new Date().toISOString().split('T')[0]
    };

    if (!transaction.description || !transaction.category) {
        showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    state.transactions.unshift(transaction);
    e.target.reset();
    updateDisplay();
    showMessage('Transação adicionada com sucesso!', 'success');
}

function handleScheduledSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const scheduledTransaction = {
        id: state.nextId++,
        description: formData.get('scheduled-description').trim(),
        amount: parseFloat(formData.get('scheduled-amount')) * (formData.get('scheduled-type') === 'despesa' ? -1 : 1),
        type: formData.get('scheduled-type'),
        category: document.getElementById('scheduled-category').value,
        scheduledDate: document.getElementById('scheduled-date').value,
        repeat: document.getElementById('scheduled-repeat').value,
        isScheduled: true
    };

    if (!scheduledTransaction.description || !scheduledTransaction.category || !scheduledTransaction.scheduledDate) {
        showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    // Check if date is in the future
    const selectedDate = new Date(scheduledTransaction.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        showMessage('A data deve ser hoje ou no futuro.', 'error');
        return;
    }

    state.scheduledTransactions.unshift(scheduledTransaction);
    e.target.reset();
    updateDisplay();
    showMessage('Transação agendada com sucesso!', 'success');
}

function deleteTransaction(id, isScheduled = false) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
        return;
    }

    if (isScheduled) {
        state.scheduledTransactions = state.scheduledTransactions.filter(t => t.id !== id);
    } else {
        state.transactions = state.transactions.filter(t => t.id !== id);
    }
    
    updateDisplay();
    showMessage('Transação excluída com sucesso!', 'success');
}

function executeScheduledTransaction(id) {
    const scheduledTransaction = state.scheduledTransactions.find(t => t.id === id);
    if (!scheduledTransaction) return;

    // Add as regular transaction
    const transaction = {
        id: state.nextId++,
        description: scheduledTransaction.description,
        amount: scheduledTransaction.amount,
        type: scheduledTransaction.type,
        category: scheduledTransaction.category,
        date: new Date().toISOString().split('T')[0]
    };

    state.transactions.unshift(transaction);

    // Handle repeat logic
    if (scheduledTransaction.repeat !== 'once') {
        const nextDate = new Date(scheduledTransaction.scheduledDate);
        switch (scheduledTransaction.repeat) {
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }
        scheduledTransaction.scheduledDate = nextDate.toISOString().split('T')[0];
    } else {
        // Remove if it's a one-time scheduled transaction
        state.scheduledTransactions = state.scheduledTransactions.filter(t => t.id !== id);
    }

    updateDisplay();
    showMessage('Transação agendada executada!', 'success');
}

function applyFilters() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    const typeFilter = elements.filterType.value;
    const categoryFilter = elements.filterCategory.value;

    let allTransactions = [...state.transactions];
    
    // Include scheduled transactions if filter allows
    if (typeFilter === 'all' || typeFilter === 'scheduled') {
        allTransactions = [...allTransactions, ...state.scheduledTransactions];
    }

    state.filteredTransactions = allTransactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || 
                          (typeFilter === 'scheduled' && transaction.isScheduled) ||
                          (typeFilter !== 'scheduled' && transaction.type === typeFilter);
        const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;

        return matchesSearch && matchesType && matchesCategory;
    });

    renderTransactionList();
}

function updateDisplay() {
    updateSummaryCards();
    updateChart();
    applyFilters();
    checkScheduledTransactions();
}

function updateSummaryCards() {
    const totals = state.transactions.reduce((acc, transaction) => {
        if (transaction.amount > 0) {
            acc.receitas += transaction.amount;
        } else {
            acc.despesas += Math.abs(transaction.amount);
        }
        return acc;
    }, { receitas: 0, despesas: 0 });

    const saldo = totals.receitas - totals.despesas;

    elements.totalReceitas.textContent = formatCurrency(totals.receitas);
    elements.totalDespesas.textContent = formatCurrency(totals.despesas);
    elements.saldoTotal.textContent = formatCurrency(saldo);

    // Update saldo color
    elements.saldoTotal.className = `card-value ${saldo >= 0 ? 'value-positive' : 'value-negative'}`;
}

function updateChart() {
    const totals = state.transactions.reduce((acc, transaction) => {
        if (transaction.amount > 0) {
            acc.receitas += transaction.amount;
        } else {
            acc.despesas += Math.abs(transaction.amount);
        }
        return acc;
    }, { receitas: 0, despesas: 0 });

    state.chart.data.datasets[0].data = [totals.receitas, totals.despesas];
    state.chart.update();
}

function renderTransactionList() {
    elements.transactionList.innerHTML = '';

    if (state.filteredTransactions.length === 0) {
        elements.transactionList.innerHTML = `
            <article style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <p>Nenhuma transação encontrada</p>
            </article>
        `;
        return;
    }

    state.filteredTransactions.forEach(transaction => {
        const transactionElement = document.createElement('article');
        transactionElement.className = `transaction-item ${transaction.isScheduled ? 'scheduled' : transaction.type}`;

        const isScheduledDue = transaction.isScheduled && new Date(transaction.scheduledDate) <= new Date();
        const statusBadge = transaction.isScheduled ? 
            `<span style="font-size: 0.75rem; background: var(--warning); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; margin-left: 0.5rem;">
                ${isScheduledDue ? 'VENCIDA' : 'AGENDADA'}
            </span>` : '';

        transactionElement.innerHTML = `
            <section class="transaction-info">
                <h4>${transaction.description} ${statusBadge}</h4>
                <p>${getCategoryName(transaction.category)} • ${formatDate(transaction.isScheduled ? transaction.scheduledDate : transaction.date)}</p>
                ${transaction.isScheduled && transaction.repeat !== 'once' ? 
                    `<p style="font-size: 0.75rem; color: var(--info);">Repete: ${getRepeatText(transaction.repeat)}</p>` : ''}
            </section>
            <section style="display: flex; align-items: center; gap: 1rem;">
                <span class="transaction-amount ${transaction.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                    ${formatCurrency(Math.abs(transaction.amount))}
                </span>
                <nav class="transaction-actions">
                    ${transaction.isScheduled ? `
                        <button class="btn btn-primary btn-sm" onclick="executeScheduledTransaction(${transaction.id})" title="Executar agora">
                            ✓
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${transaction.id}, ${transaction.isScheduled})" title="Excluir">
                        ✕
                    </button>
                </nav>
            </section>
        `;

        elements.transactionList.appendChild(transactionElement);
    });
}

function checkScheduledTransactions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueTransactions = state.scheduledTransactions.filter(transaction => {
        const scheduledDate = new Date(transaction.scheduledDate);
        scheduledDate.setHours(0, 0, 0, 0);
        return scheduledDate <= today;
    });

    if (dueTransactions.length > 0) {
        showMessage(`Você tem ${dueTransactions.length} transação(ões) agendada(s) vencida(s)!`, 'warning');
    }
}

function exportData() {
    const data = {
        transactions: state.transactions,
        scheduledTransactions: state.scheduledTransactions,
        exportDate: new Date().toISOString(),
        summary: {
            totalReceitas: state.transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
            totalDespesas: state.transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
        }
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `contudo-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showMessage('Dados exportados com sucesso!', 'success');
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
}

function getCategoryName(category) {
    const categories = {
        salario: 'Salário',
        freelance: 'Freelance',
        alimentacao: 'Alimentação',
        transporte: 'Transporte',
        moradia: 'Moradia',
        saude: 'Saúde',
        educacao: 'Educação',
        lazer: 'Lazer',
        outros: 'Outros'
    };
    return categories[category] || category;
}

function getRepeatText(repeat) {
    const texts = {
        weekly: 'Semanal',
        monthly: 'Mensal',
        yearly: 'Anual',
        once: 'Uma vez'
    };
    return texts[repeat] || repeat;
}

function showMessage(message, type = 'success') {
    const messageElement = document.createElement('div');
    messageElement.className = 'success-message';
    messageElement.textContent = message;
    
    if (type === 'error') {
        messageElement.style.backgroundColor = 'var(--danger)';
    } else if (type === 'warning') {
        messageElement.style.backgroundColor = 'var(--warning)';
    }

    document.body.appendChild(messageElement);

    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 4000);
}

// Check for due scheduled transactions on page load
setInterval(checkScheduledTransactions, 60000); // Check every minute