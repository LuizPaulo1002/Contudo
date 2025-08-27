// frontend/script.js
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
        const transactions = await response.json();
        updateDOM(transactions);
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
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
        const sign = amount < 0 ? '-' : '+';
        const formattedAmount = `R$ ${Math.abs(amount).toFixed(2)}`;

        item.innerHTML = `
            ${transaction.description} <span>${sign} ${formattedAmount}</span>
        `;
        transactionList.appendChild(item);

        // Calcula totais
        if (transaction.type === 'receita') {
            totalReceitas += amount;
        } else {
            totalDespesas += amount;
        }
    });

    const saldoTotal = totalReceitas + totalDespesas;

    // Atualiza os cards de resumo
    totalReceitasEl.textContent = `R$ ${totalReceitas.toFixed(2)}`;
    totalDespesasEl.textContent = `R$ ${Math.abs(totalDespesas).toFixed(2)}`;
    saldoTotalEl.textContent = `R$ ${saldoTotal.toFixed(2)}`;
}

// Função para adicionar uma nova transação
async function addTransaction(event) {
    event.preventDefault();

    const description = descriptionInput.value;
    const amount = parseFloat(amountInput.value);
    const type = document.querySelector('input[name="type"]:checked').value;

    if (description.trim() === '' || isNaN(amount)) {
        alert('Por favor, preencha a descrição e o valor corretamente.');
        return;
    }

    const newTransaction = {
        description,
        amount,
        type,
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTransaction),
        });

        // Limpa o formulário e atualiza a lista
        descriptionInput.value = '';
        amountInput.value = '';
        fetchTransactions();
    } catch (error) {
        console.error('Erro ao adicionar transação:', error);
    }
}


// Event Listeners
form.addEventListener('submit', addTransaction);

// Inicialização
document.addEventListener('DOMContentLoaded', fetchTransactions);