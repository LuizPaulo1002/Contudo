const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// "Banco de dados" em memória
let transactions = [
    { id: 1, description: 'Salário Mensal', amount: 5000.00, type: 'receita', date: new Date().toISOString() },
    { id: 2, description: 'Aluguel', amount: -1500.00, type: 'despesa', date: new Date().toISOString() },
    { id: 3, description: 'Supermercado', amount: -450.50, type: 'despesa', date: new Date().toISOString() }
];
let nextId = 4;

// ROTA [GET] - Retorna todas as transações
app.get('/transactions', (req, res) => {
    try {
        // Ordena por ID decrescente (mais recentes primeiro)
        const sortedTransactions = transactions.sort((a, b) => b.id - a.id);
        res.json(sortedTransactions);
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ROTA [GET] - Retorna uma transação específica
app.get('/transactions/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const transaction = transactions.find(t => t.id === id);
        
        if (!transaction) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }
        
        res.json(transaction);
    } catch (error) {
        console.error('Erro ao buscar transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ROTA [POST] - Adiciona uma nova transação
app.post('/transactions', (req, res) => {
    try {
        const { description, amount, type } = req.body;

        // Validações
        if (!description || description.trim() === '') {
            return res.status(400).json({ error: 'Descrição é obrigatória' });
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Valor deve ser um número positivo' });
        }

        if (!type || !['receita', 'despesa'].includes(type)) {
            return res.status(400).json({ error: 'Tipo deve ser "receita" ou "despesa"' });
        }

        const newTransaction = {
            id: nextId++,
            description: description.trim(),
            // Garante que receitas são positivas e despesas são negativas
            amount: type === 'despesa' ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
            type,
            date: new Date().toISOString()
        };

        transactions.push(newTransaction);
        
        console.log(`Nova transação criada: ${newTransaction.description} - R$ ${newTransaction.amount}`);
        res.status(201).json(newTransaction);
        
    } catch (error) {
        console.error('Erro ao criar transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ROTA [PUT] - Atualiza uma transação existente
app.put('/transactions/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { description, amount, type } = req.body;
        
        const transactionIndex = transactions.findIndex(t => t.id === id);
        
        if (transactionIndex === -1) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }

        // Validações
        if (description && description.trim() === '') {
            return res.status(400).json({ error: 'Descrição não pode estar vazia' });
        }

        if (amount && (isNaN(amount) || amount <= 0)) {
            return res.status(400).json({ error: 'Valor deve ser um número positivo' });
        }

        if (type && !['receita', 'despesa'].includes(type)) {
            return res.status(400).json({ error: 'Tipo deve ser "receita" ou "despesa"' });
        }

        // Atualiza apenas os campos fornecidos
        if (description) transactions[transactionIndex].description = description.trim();
        if (amount) {
            const finalType = type || transactions[transactionIndex].type;
            transactions[transactionIndex].amount = finalType === 'despesa' ? 
                -Math.abs(Number(amount)) : Math.abs(Number(amount));
        }
        if (type) {
            transactions[transactionIndex].type = type;
            // Recalcula o valor com o novo tipo
            const currentAmount = Math.abs(transactions[transactionIndex].amount);
            transactions[transactionIndex].amount = type === 'despesa' ? -currentAmount : currentAmount;
        }

        console.log(`Transação atualizada: ID ${id}`);
        res.json(transactions[transactionIndex]);
        
    } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ROTA [DELETE] - Remove uma transação
app.delete('/transactions/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const transactionIndex = transactions.findIndex(t => t.id === id);
        
        if (transactionIndex === -1) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }
        
        const deletedTransaction = transactions.splice(transactionIndex, 1)[0];
        
        console.log(`Transação removida: ${deletedTransaction.description}`);
        res.json({ message: 'Transação removida com sucesso', transaction: deletedTransaction });
        
    } catch (error) {
        console.error('Erro ao remover transação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ROTA [GET] - Estatísticas resumidas
app.get('/transactions/stats/summary', (req, res) => {
    try {
        const receitas = transactions
            .filter(t => t.type === 'receita')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const despesas = transactions
            .filter(t => t.type === 'despesa')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
        const saldo = receitas - despesas;
        const totalTransactions = transactions.length;
        
        res.json({
            receitas,
            despesas,
            saldo,
            totalTransactions,
            receitasCount: transactions.filter(t => t.type === 'receita').length,
            despesasCount: transactions.filter(t => t.type === 'despesa').length
        });
    } catch (error) {
        console.error('Erro ao calcular estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware para tratamento de erros
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`🚀 Servidor "Contudo" rodando em http://localhost:${port}`);
    console.log(`📊 Total de transações iniciais: ${transactions.length}`);
});