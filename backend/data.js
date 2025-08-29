// Data management for Contudo application

class DataManager {
    constructor() {
        this.expenses = [];
        this.nextId = 1;
        this.currentYear = new Date().getFullYear();
        this.currentMonth = new Date().getMonth() + 1;
        this.loadData();
        this.initializeSampleData();
    }

    // Initialize with sample data similar to the images
    initializeSampleData() {
        if (this.expenses.length === 0) {
            const sampleData = [
                // Fixed expenses (similar to the first image)
                {
                    id: this.nextId++,
                    description: 'Academia',
                    amount: 110.00,
                    category: 'saude',
                    type: 'fixo',
                    date: '2025-08-20',
                    dueDate: '2025-08-20',
                    isPaid: false
                },
                {
                    id: this.nextId++,
                    description: 'Netflix',
                    amount: 39.90,
                    category: 'lazer',
                    type: 'fixo',
                    date: '2025-08-28',
                    dueDate: '2025-08-28',
                    isPaid: false
                },
                {
                    id: this.nextId++,
                    description: 'Spotify',
                    amount: 12.90,
                    category: 'lazer',
                    type: 'fixo',
                    date: '2025-08-15',
                    dueDate: '2025-08-15',
                    isPaid: false,
                    isOverdue: true
                },
                {
                    id: this.nextId++,
                    description: 'Aluguel',
                    amount: 1200.00,
                    category: 'moradia',
                    type: 'fixo',
                    date: '2025-08-23',
                    dueDate: '2025-08-23',
                    isPaid: false
                },
                // Variable expenses
                {
                    id: this.nextId++,
                    description: 'Teclado Mecânico',
                    amount: 280.00,
                    category: 'outros',
                    type: 'diverso',
                    date: '2025-08-25',
                    isPaid: true
                },
                {
                    id: this.nextId++,
                    description: 'Monitor',
                    amount: 850.00,
                    category: 'outros',
                    type: 'diverso',
                    date: '2025-08-26',
                    isPaid: true
                },
                {
                    id: this.nextId++,
                    description: 'Uber',
                    amount: 40.00,
                    category: 'transporte',
                    type: 'diverso',
                    date: '2025-08-27',
                    isPaid: true
                }
            ];

            this.expenses = sampleData;
            this.saveData();
        }
    }

    // Historical data for dashboard (similar to the chart in image 2)
    getHistoricalData() {
        return {
            2025: {
                1: { fixed: 250.00, variable: 500.00, total: 750.00 },
                2: { fixed: 250.00, variable: 100.00, total: 350.00 },
                3: { fixed: 750.00, variable: 0.00, total: 750.00 },
                4: { fixed: 1050.00, variable: 0.00, total: 1050.00 },
                5: { fixed: 1450.00, variable: 0.00, total: 1450.00 },
                6: { fixed: 700.00, variable: 0.00, total: 700.00 },
                7: { fixed: 850.00, variable: 0.00, total: 850.00 },
                8: { fixed: 1362.80, variable: 1170.00, total: 2532.80 }
            }
        };
    }

    // Get expenses by type
    getFixedExpenses() {
        return this.expenses.filter(expense => expense.type === 'fixo');
    }

    getVariableExpenses() {
        return this.expenses.filter(expense => expense.type === 'diverso');
    }

    // Get expenses by month/year
    getExpensesByPeriod(year, month) {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === year && 
                   expenseDate.getMonth() + 1 === month;
        });
    }

    // Add new expense
    addExpense(expenseData) {
        const newExpense = {
            id: this.nextId++,
            ...expenseData,
            isPaid: false,
            createdAt: new Date().toISOString()
        };

        // Check if it's overdue (for fixed expenses with due dates)
        if (newExpense.type === 'fixo' && newExpense.dueDate) {
            const today = new Date();
            const dueDate = new Date(newExpense.dueDate);
            newExpense.isOverdue = dueDate < today && !newExpense.isPaid;
        }

        this.expenses.push(newExpense);
        this.saveData();
        return newExpense;
    }

    // Update expense
    updateExpense(id, updates) {
        const expenseIndex = this.expenses.findIndex(expense => expense.id === id);
        if (expenseIndex !== -1) {
            this.expenses[expenseIndex] = {
                ...this.expenses[expenseIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // Update overdue status if needed
            const expense = this.expenses[expenseIndex];
            if (expense.type === 'fixo' && expense.dueDate) {
                const today = new Date();
                const dueDate = new Date(expense.dueDate);
                expense.isOverdue = dueDate < today && !expense.isPaid;
            }

            this.saveData();
            return this.expenses[expenseIndex];
        }
        return null;
    }

    // Delete expense
    deleteExpense(id) {
        const expenseIndex = this.expenses.findIndex(expense => expense.id === id);
        if (expenseIndex !== -1) {
            const deletedExpense = this.expenses.splice(expenseIndex, 1)[0];
            this.saveData();
            return deletedExpense;
        }
        return null;
    }

    // Mark expense as paid
    markAsPaid(id) {
        return this.updateExpense(id, { 
            isPaid: true, 
            paidAt: new Date().toISOString(),
            isOverdue: false 
        });
    }

    // Copy previous month's fixed expenses
    copyPreviousMonthFixed() {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        // Get previous month
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = currentYear - 1;
        }

        // Get previous month's fixed expenses
        const prevFixedExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expense.type === 'fixo' && 
                   expenseDate.getFullYear() === prevYear &&
                   expenseDate.getMonth() + 1 === prevMonth;
        });

        // Copy them to current month
        const copiedExpenses = [];
        prevFixedExpenses.forEach(expense => {
            const newExpense = {
                ...expense,
                id: this.nextId++,
                date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${expense.date.split('-')[2]}`,
                dueDate: expense.dueDate ? `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${expense.dueDate.split('-')[2]}` : null,
                isPaid: false,
                isOverdue: false,
                createdAt: new Date().toISOString()
            };
            copiedExpenses.push(newExpense);
        });

        this.expenses.push(...copiedExpenses);
        this.saveData();
        return copiedExpenses;
    }

    // Calculate totals
    calculateTotals(year = null, month = null) {
        let expensesToCalculate = this.expenses;
        
        if (year && month) {
            expensesToCalculate = this.getExpensesByPeriod(year, month);
        }

        const fixed = expensesToCalculate
            .filter(expense => expense.type === 'fixo')
            .reduce((total, expense) => total + expense.amount, 0);

        const variable = expensesToCalculate
            .filter(expense => expense.type === 'diverso')
            .reduce((total, expense) => total + expense.amount, 0);

        return {
            fixed,
            variable,
            total: fixed + variable
        };
    }

    // Get overdue expenses
    getOverdueExpenses() {
        const today = new Date();
        return this.expenses.filter(expense => {
            if (expense.isPaid || expense.type !== 'fixo' || !expense.dueDate) {
                return false;
            }
            const dueDate = new Date(expense.dueDate);
            return dueDate < today;
        });
    }

    // Get upcoming expenses (next 7 days)
    getUpcomingExpenses() {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return this.expenses.filter(expense => {
            if (expense.isPaid || expense.type !== 'fixo' || !expense.dueDate) {
                return false;
            }
            const dueDate = new Date(expense.dueDate);
            return dueDate >= today && dueDate <= nextWeek;
        });
    }

    // Category mappings
    getCategoryIcon(category) {
        const icons = {
            alimentacao: '🍽️',
            transporte: '🚗',
            moradia: '🏠',
            saude: '🏥',
            educacao: '📚',
            lazer: '🎮',
            outros: '📦'
        };
        return icons[category] || '📦';
    }

    getCategoryName(category) {
        const names = {
            alimentacao: 'Alimentação',
            transporte: 'Transporte',
            moradia: 'Moradia',
            saude: 'Saúde',
            educacao: 'Educação',
            lazer: 'Lazer',
            outros: 'Outros'
        };
        return names[category] || 'Outros';
    }

    // Data persistence
    saveData() {
        try {
            localStorage.setItem('contudo_expenses', JSON.stringify(this.expenses));
            localStorage.setItem('contudo_nextId', this.nextId.toString());
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    loadData() {
        try {
            const savedExpenses = localStorage.getItem('contudo_expenses');
            const savedNextId = localStorage.getItem('contudo_nextId');
            
            if (savedExpenses) {
                this.expenses = JSON.parse(savedExpenses);
            }
            
            if (savedNextId) {
                this.nextId = parseInt(savedNextId, 10);
            }

            // Update overdue status on load
            this.updateOverdueStatus();
        } catch (error) {
            console.error('Error loading data:', error);
            this.expenses = [];
            this.nextId = 1;
        }
    }

    // Update overdue status for all fixed expenses
    updateOverdueStatus() {
        const today = new Date();
        let hasChanges = false;

        this.expenses.forEach(expense => {
            if (expense.type === 'fixo' && expense.dueDate && !expense.isPaid) {
                const dueDate = new Date(expense.dueDate);
                const shouldBeOverdue = dueDate < today;
                
                if (expense.isOverdue !== shouldBeOverdue) {
                    expense.isOverdue = shouldBeOverdue;
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            this.saveData();
        }
    }

    // Export data
    exportData() {
        const data = {
            expenses: this.expenses,
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                totalExpenses: this.expenses.length
            }
        };
        return data;
    }

    // Import data
    importData(data) {
        try {
            if (data.expenses && Array.isArray(data.expenses)) {
                this.expenses = data.expenses;
                this.nextId = Math.max(...this.expenses.map(e => e.id), 0) + 1;
                this.updateOverdueStatus();
                this.saveData();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        this.expenses = [];
        this.nextId = 1;
        this.saveData();
    }
}

// Create global data manager instance
window.dataManager = new DataManager();