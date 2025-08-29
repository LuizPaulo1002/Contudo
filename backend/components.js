// UI Components for Contudo application

class UIComponents {
    // Format currency
    static formatCurrency(amount) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    }

    // Format date
    static formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    }

    // Show notification
    static showNotification(title, message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? '✓' : 
                    type === 'error' ? '✕' : 
                    type === 'warning' ? '⚠' : 'ℹ';
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        const timer = setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timer);
            this.removeNotification(notification);
        });

        return notification;
    }

    static removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 300);
        }
    }

    // Create expense item component
    static createExpenseItem(expense) {
        const item = document.createElement('div');
        item.className = `expense-item ${expense.isOverdue ? 'overdue' : ''}`;
        item.dataset.id = expense.id;

        const categoryIcon = window.dataManager.getCategoryIcon(expense.category);
        const categoryName = window.dataManager.getCategoryName(expense.category);
        
        let statusInfo = '';
        if (expense.type === 'fixo' && expense.dueDate) {
            const dueDate = this.formatDate(expense.dueDate);
            statusInfo = expense.isOverdue ? 
                `<span class="badge danger">Vence em ${dueDate}</span>` :
                `(vence em ${dueDate})`;
        }

        item.innerHTML = `
            <div class="expense-info">
                <h4>${categoryIcon} ${expense.description}</h4>
                <p>${categoryName} • ${this.formatDate(expense.date)} ${statusInfo}</p>
            </div>
            <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
            <div class="expense-actions">
                ${expense.type === 'fixo' && !expense.isPaid ? 
                    `<button class="btn-edit tooltip" onclick="UIComponents.markAsPaid(${expense.id})" title="Marcar como pago">✓</button>` : 
                    ''}
                <button class="btn-edit tooltip" onclick="UIComponents.editExpense(${expense.id})" title="Editar">✏️</button>
                <button class="btn-delete tooltip" onclick="UIComponents.deleteExpense(${expense.id})" title="Excluir">✕</button>
            </div>
        `;

        return item;
    }

    // Create empty state component
    static createEmptyState(title, message, actionText = null, actionCallback = null) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        emptyState.innerHTML = `
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-title">${title}</div>
            <div class="empty-state-message">${message}</div>
            ${actionText ? `<button class="empty-state-action">${actionText}</button>` : ''}
        `;

        if (actionText && actionCallback) {
            emptyState.querySelector('.empty-state-action').addEventListener('click', actionCallback);
        }

        return emptyState;
    }

    // Modal management
    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Form handling
    static resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            // Set default date to today
            const dateInput = form.querySelector('input[type="date"]');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
        }
    }

    // Expense actions
    static editExpense(id) {
        const expense = window.dataManager.expenses.find(e => e.id === id);
        if (expense) {
            // Populate form with expense data
            document.getElementById('transaction-description').value = expense.description;
            document.getElementById('transaction-amount').value = expense.amount;
            document.getElementById('transaction-date').value = expense.date;
            document.getElementById('transaction-category').value = expense.category;
            
            // Set type radio button
            const typeRadio = document.querySelector(`input[name="transaction-type"][value="${expense.type}"]`);
            if (typeRadio) {
                typeRadio.checked = true;
            }

            // Store expense ID for update
            const form = document.getElementById('transaction-form');
            form.dataset.editId = id;

            this.openModal('transaction-modal');
        }
    }

    static deleteExpense(id) {
        if (confirm('Tem certeza que deseja excluir esta despesa?')) {
            const deleted = window.dataManager.deleteExpense(id);
            if (deleted) {
                this.showNotification('Sucesso', 'Despesa excluída com sucesso!');
                window.app.refreshDisplay();
            }
        }
    }

    static markAsPaid(id) {
        const updated = window.dataManager.markAsPaid(id);
        if (updated) {
            this.showNotification('Sucesso', 'Despesa marcada como paga!');
            window.app.refreshDisplay();
        }
    }

    // Loading state
    static showLoading(element, text = 'Carregando...') {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <span>${text}</span>
        `;
        
        element.innerHTML = '';
        element.appendChild(loading);
    }

    // Validation helpers
    static validateForm(formData) {
        const errors = [];

        if (!formData.description || formData.description.trim() === '') {
            errors.push('Descrição é obrigatória');
        }

        if (!formData.amount || formData.amount <= 0) {
            errors.push('Valor deve ser maior que zero');
        }

        if (!formData.category) {
            errors.push('Categoria é obrigatória');
        }

        if (!formData.date) {
            errors.push('Data é obrigatória');
        }

        return errors;
    }

    // Utility functions
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Export functionality
    static exportData() {
        try {
            const data = window.dataManager.exportData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `contudo-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(link.href);
            this.showNotification('Sucesso', 'Dados exportados com sucesso!');
        } catch (error) {
            this.showNotification('Erro', 'Erro ao exportar dados', 'error');
        }
    }

    // Import functionality
    static importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (window.dataManager.importData(data)) {
                            this.showNotification('Sucesso', 'Dados importados com sucesso!');
                            window.app.refreshDisplay();
                        } else {
                            this.showNotification('Erro', 'Formato de arquivo inválido', 'error');
                        }
                    } catch (error) {
                        this.showNotification('Erro', 'Erro ao importar dados', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    // Theme management
    static toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        
        if (isDark) {
            body.classList.remove('dark-theme');
            localStorage.setItem('contudo-theme', 'light');
        } else {
            body.classList.add('dark-theme');
            localStorage.setItem('contudo-theme', 'dark');
        }
    }

    static loadTheme() {
        const savedTheme = localStorage.getItem('contudo-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    // Responsive helpers
    static isMobile() {
        return window.innerWidth <= 768;
    }

    static adaptToScreenSize() {
        const header = document.querySelector('.header-content');
        if (this.isMobile()) {
            header.classList.add('mobile');
        } else {
            header.classList.remove('mobile');
        }
    }

    // Accessibility helpers
    static announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        
        document.body.appendChild(announcement);
        announcement.textContent = message;
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Focus management
    static trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });

        firstElement.focus();
    }
}