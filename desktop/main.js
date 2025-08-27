const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

// Configuração do servidor Express integrado
let server;
let mainWindow;
const port = 3001;

// Dados da aplicação
const appData = {
    transactions: [
        { id: 1, description: 'Salário Mensal', amount: 5000.00, type: 'receita', date: new Date().toISOString() },
        { id: 2, description: 'Aluguel', amount: -1500.00, type: 'despesa', date: new Date().toISOString() },
        { id: 3, description: 'Supermercado', amount: -450.50, type: 'despesa', date: new Date().toISOString() }
    ],
    nextId: 4,
    settings: {
        theme: 'light',
        currency: 'BRL',
        language: 'pt-BR',
        autoBackup: true
    }
};

// Configuração do servidor interno
function createServer() {
    const serverApp = express();
    serverApp.use(cors());
    serverApp.use(express.json());

    // Middleware de logging
    serverApp.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });

    // Rotas da API
    serverApp.get('/transactions', (req, res) => {
        const sortedTransactions = appData.transactions.sort((a, b) => b.id - a.id);
        res.json(sortedTransactions);
    });

    serverApp.post('/transactions', (req, res) => {
        const { description, amount, type } = req.body;

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
            id: appData.nextId++,
            description: description.trim(),
            amount: type === 'despesa' ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
            type,
            date: new Date().toISOString()
        };

        appData.transactions.push(newTransaction);
        saveAppData();
        res.status(201).json(newTransaction);
    });

    serverApp.delete('/transactions/:id', (req, res) => {
        const id = parseInt(req.params.id);
        const transactionIndex = appData.transactions.findIndex(t => t.id === id);
        
        if (transactionIndex === -1) {
            return res.status(404).json({ error: 'Transação não encontrada' });
        }
        
        const deletedTransaction = appData.transactions.splice(transactionIndex, 1)[0];
        saveAppData();
        res.json({ message: 'Transação removida com sucesso', transaction: deletedTransaction });
    });

    // Rota para configurações
    serverApp.get('/settings', (req, res) => {
        res.json(appData.settings);
    });

    serverApp.put('/settings', (req, res) => {
        appData.settings = { ...appData.settings, ...req.body };
        saveAppData();
        res.json(appData.settings);
    });

    // Rota para backup
    serverApp.post('/backup', (req, res) => {
        const backupData = {
            transactions: appData.transactions,
            settings: appData.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        res.json(backupData);
    });

    serverApp.post('/restore', (req, res) => {
        try {
            const { transactions, settings } = req.body;
            if (transactions) appData.transactions = transactions;
            if (settings) appData.settings = settings;
            saveAppData();
            res.json({ message: 'Dados restaurados com sucesso' });
        } catch (error) {
            res.status(400).json({ error: 'Dados inválidos para restauração' });
        }
    });

    server = serverApp.listen(port, 'localhost', () => {
        console.log(`🚀 Servidor interno rodando em http://localhost:${port}`);
    });
}

// Função para salvar dados
function saveAppData() {
    const userDataPath = app.getPath('userData');
    const dataPath = path.join(userDataPath, 'contudo-data.json');
    
    try {
        fs.writeFileSync(dataPath, JSON.stringify(appData, null, 2));
        console.log('Dados salvos com sucesso');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
    }
}

// Função para carregar dados
function loadAppData() {
    const userDataPath = app.getPath('userData');
    const dataPath = path.join(userDataPath, 'contudo-data.json');
    
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.assign(appData, data);
            console.log('Dados carregados com sucesso');
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function createWindow() {
    // Carrega os dados salvos
    loadAppData();
    
    // Inicia o servidor interno
    createServer();

    // Cria a janela principal
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        titleBarStyle: 'default',
        show: false
    });

    // Carrega a aplicação
    mainWindow.loadFile('frontend/index.html');

    // Mostra a janela quando estiver pronta
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Event listeners
    mainWindow.on('closed', () => {
        mainWindow = null;
        if (server) {
            server.close();
        }
    });

    // Menu da aplicação
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'Arquivo',
            submenu: [
                {
                    label: 'Novo',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'new-transaction');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exportar Dados',
                    accelerator: 'CmdOrCtrl+E',
                    click: async () => {
                        try {
                            const result = await dialog.showSaveDialog(mainWindow, {
                                title: 'Exportar Dados',
                                defaultPath: `contudo-backup-${new Date().toISOString().split('T')[0]}.json`,
                                filters: [
                                    { name: 'JSON Files', extensions: ['json'] }
                                ]
                            });

                            if (!result.canceled) {
                                const backupData = {
                                    transactions: appData.transactions,
                                    settings: appData.settings,
                                    exportDate: new Date().toISOString(),
                                    version: '1.0.0'
                                };
                                fs.writeFileSync(result.filePath, JSON.stringify(backupData, null, 2));
                                dialog.showMessageBox(mainWindow, {
                                    type: 'info',
                                    title: 'Exportação Concluída',
                                    message: 'Dados exportados com sucesso!'
                                });
                            }
                        } catch (error) {
                            dialog.showErrorBox('Erro', 'Erro ao exportar dados: ' + error.message);
                        }
                    }
                },
                {
                    label: 'Importar Dados',
                    accelerator: 'CmdOrCtrl+I',
                    click: async () => {
                        try {
                            const result = await dialog.showOpenDialog(mainWindow, {
                                title: 'Importar Dados',
                                filters: [
                                    { name: 'JSON Files', extensions: ['json'] }
                                ],
                                properties: ['openFile']
                            });

                            if (!result.canceled && result.filePaths.length > 0) {
                                const data = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
                                if (data.transactions) appData.transactions = data.transactions;
                                if (data.settings) appData.settings = data.settings;
                                saveAppData();
                                mainWindow.webContents.reload();
                                dialog.showMessageBox(mainWindow, {
                                    type: 'info',
                                    title: 'Importação Concluída',
                                    message: 'Dados importados com sucesso!'
                                });
                            }
                        } catch (error) {
                            dialog.showErrorBox('Erro', 'Erro ao importar dados: ' + error.message);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Sair',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Visualizar',
            submenu: [
                {
                    label: 'Recarregar',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.webContents.reload();
                    }
                },
                {
                    label: 'Ferramentas do Desenvolvedor',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(currentZoom + 0.1);
                    }
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        const currentZoom = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(Math.max(0.5, currentZoom - 0.1));
                    }
                },
                {
                    label: 'Zoom Reset',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        mainWindow.webContents.setZoomFactor(1.0);
                    }
                }
            ]
        },
        {
            label: 'Configurações',
            submenu: [
                {
                    label: 'Preferências',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        mainWindow.webContents.send('menu-action', 'open-settings');
                    }
                },
                {
                    label: 'Tema Escuro',
                    type: 'checkbox',
                    checked: appData.settings.theme === 'dark',
                    click: () => {
                        appData.settings.theme = appData.settings.theme === 'dark' ? 'light' : 'dark';
                        saveAppData();
                        mainWindow.webContents.send('theme-changed', appData.settings.theme);
                    }
                }
            ]
        },
        {
            label: 'Ajuda',
            submenu: [
                {
                    label: 'Sobre',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Sobre o Contudo',
                            message: 'Contudo - Controle Financeiro Pessoal',
                            detail: `Versão: 1.0.0
Desenvolvido por: Luiz Paulo Peixoto

LinkedIn: luiz-paulo-607279302
GitHub: LuizPaulo1002

Uma aplicação simples e eficiente para gerenciar suas finanças pessoais.`
                        });
                    }
                },
                {
                    label: 'GitHub',
                    click: () => {
                        shell.openExternal('https://github.com/LuizPaulo1002');
                    }
                },
                {
                    label: 'LinkedIn',
                    click: () => {
                        shell.openExternal('https://linkedin.com/in/luiz-paulo-607279302');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Event handlers do Electron
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        if (server) {
            server.close();
        }
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Salva dados antes de sair
app.on('before-quit', () => {
    saveAppData();
});

// IPC handlers
ipcMain.handle('get-settings', () => {
    return appData.settings;
});

ipcMain.handle('update-settings', (event, newSettings) => {
    appData.settings = { ...appData.settings, ...newSettings };
    saveAppData();
    return appData.settings;
});