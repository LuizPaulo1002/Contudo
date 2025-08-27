const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

// Permite comunicação entre domínios diferentes (frontend e backend)
// e para o Express entender o formato JSON
app.use(cors());
app.use(express.json());

//"banco de dados" em memória.
let transactions = [
    { id: 1, description: 'Salário Mensal', amount: 5000.00, type: 'receita' },
    { id: 2, description: 'Aluguel', amount: -1500.00, type: 'despesa' },
    { id: 3, description: 'Supermercado', amount: -450.50, type: 'despesa' }
];
let nextId = 4;

// ROTA [GET] - Retorna todas as transações
app.get('/transactions', (req, res) => {
    res.json(transactions);
});

// ROTA [POST] - Adiciona uma nova transação
app.post('/transactions', (req, res) => {
    const { description, amount, type } = req.body;

    // Validação simples
    if (!description || !amount || !type) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const newTransaction = {
        id: nextId++,
        description,
        // Garante que o valor da despesa seja negativo
        amount: type === 'despesa' ? -Math.abs(amount) : Math.abs(amount),
        type
    };

    transactions.push(newTransaction);
    res.status(201).json(newTransaction);
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor "Contudo" rodando em http://localhost:${port}`);
});