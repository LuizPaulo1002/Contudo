// frontend/script.js - Versão Corrigida
const API_URL = 'http://localhost:3000/transactions';

// Elementos do DOM
const totalReceitasEl = document.getElementById('total-receitas');
const totalDespesasEl = document.getElementById('total-despesas');
const saldoTotalEl = document.getElementById('saldo-total');
const transactionList = document.getElementById('transaction-list');
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeRadio = document.querySelectorAll('input[name="type"]');

// Função para buscar transações do backend
async function fetchTransactions() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const transactions = await response.json();
        updateDOM(transactions);
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        alert('Erro ao carregar transações. Verifique se o servidor está rodando.');
    }
}

// Função para atualizar o DOM com os dados
function updateDOM(transactions) {
    // Limpa a lista antes de adicionar os novos itens
    transactionList.innerHTML = '';

    let totalReceitas = 0;
    let totalDespesas = 0;

    transactions.forEach(transaction => {
        const item = document.createElement('li');
        item.classList.add(transaction.type);

        const amount = parseFloat(transaction.amount);
        
        // Formatação correta dos valores
        const isNegative = amount < 0;
        const formattedAmount = `R$ ${Math.abs(amount).toFixed(2).replace('.', ',')}`;
        const sign = isNegative ? '-' : '+';

        item.innerHTML = `
            <span class="transaction-description">${transaction.description}</span>
            <span class="transaction-amount ${transaction.type}">${sign} ${formattedAmount}</span>
            <button onclick="deleteTransaction(${transaction.id})" class="delete-btn">×</button>
        `;
        transactionList.appendChild(item);

        // Calcula totais corretamente
        if (transaction.type === 'receita') {
            totalReceitas += Math.abs(amount); // Sempre positivo para receitas
        } else {
            totalDespesas += Math.abs(amount); // Sempre positivo para mostrar o total de despesas
        }
    });

    const saldoTotal = totalReceitas - totalDespesas;

    // Atualiza os cards de resumo com formatação brasileira
    totalReceitasEl.textContent = `R$ ${totalReceitas.toFixed(2).replace('.', ',')}`;
    totalDespesasEl.textContent = `R$ ${totalDespesas.toFixed(2).replace('.', ',')}`;
    saldoTotalEl.textContent = `R$ ${saldoTotal.toFixed(2).replace('.', ',')}`;
    
    // Adiciona classe para saldo negativo
    saldoTotalEl.className = saldoTotal < 0 ? 'negative' : 'positive';
}

// Função para adicionar uma nova transação
async function addTransaction(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = document.querySelector('input[name="type"]:checked').value;

    // Validações
    if (!description) {
        alert('Por favor, preencha a descrição.');
        descriptionInput.focus();
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('Por favor, insira um valor válido maior que zero.');
        amountInput.focus();
        return;
    }

    const newTransaction = {
        description,
        amount,
        type,
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTransaction),
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        // Limpa o formulário e atualiza a lista
        form.reset();
        await fetchTransactions();
        
        // Feedback visual
        showSuccessMessage('Transação adicionada com sucesso!');
        
    } catch (error) {
        console.error('Erro ao adicionar transação:', error);
        alert('Erro ao adicionar transação. Tente novamente.');
    }
}

// Função para deletar transação
async function deleteTransaction(id) {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        await fetchTransactions();
        showSuccessMessage('Transação removida com sucesso!');
        
    } catch (error) {
        console.error('Erro ao deletar transação:', error);
        alert('Erro ao remover transação. Tente novamente.');
    }
}

// Função para mostrar mensagem de sucesso
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Event Listeners
form.addEventListener('submit', addTransaction);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    fetchTransactions();
    
    // Foco no primeiro campo ao carregar
    descriptionInput.focus();
});