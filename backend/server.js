const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

let db;

// Inicializa o banco de dados criando as colunas necessárias para o controle de KM
// EXECUTE ESTE AJUSTE DENTRO DO SEU ARQUIVO backend/server.js

// 1. Altere a seção autoinvocável de inicialização do banco para incluir a nova tabela:
(async () => {
    // Mantém a conexão existente e sua tabela registros_km...
    db = await open({ filename: './controle_km.db', driver: sqlite3.Database });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS registros_km (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT, placa TEXT, km_inicio REAL, km_final REAL, km_total REAL, rota TEXT, obs TEXT
        )
    `);

    // NOVA TABELA DE ABASTECIMENTO (Guarda as fotos como TEXT no formato Base64)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS abastecimentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            motorista TEXT,
            data TEXT,
            placa TEXT,
            carro REAL,
            km_atual REAL,
            litros_diesel REAL,
            litros_arla REAL,
            fotos TEXT
        )
    `);
})();

// 2. Adicione a nova rota POST no final do arquivo (antes do app.listen):
app.post('/abastecimento', async (req, res) => {
    try {
        const { motorista, data, placa, carro, km_atual, litros_diesel, litros_arla, fotos } = req.body;
        
        await db.run(
            `INSERT INTO abastecimentos (motorista, data, placa, carro, km_atual, litros_diesel, litros_arla, fotos) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [motorista, data, placa, carro, km_atual, litros_diesel, litros_arla, fotos]
        );
        
        res.status(201).json({ mensagem: "Abastecimento inserido com sucesso!" });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro interno ao salvar abastecimento." });
    }
});

// Rota GET: Listar todos os abastecimentos (Adicione isso ao seu backend/server.js)
app.get('/abastecimento', async (req, res) => {
    try {
        const registros = await db.all("SELECT * FROM abastecimentos ORDER BY data DESC");
        res.json(registros);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao buscar os registros de abastecimento." });
    }
});


// Rota: Listar todos os registros
app.get('/km', async (req, res) => {
    const registros = await db.all("SELECT * FROM registros_km ORDER BY data DESC");
    res.json(registros);
});

// Rota: Criar novo registro
app.post('/km', async (req, res) => {
    const { data, placa, km_inicio, km_final, km_total, rota, obs } = req.body;
    await db.run(
        "INSERT INTO registros_km (data, placa, km_inicio, km_final, km_total, rota, obs) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [data, placa, km_inicio, km_final, km_total, rota, obs]
    );
    res.status(201).json({ mensagem: "Registro inserido com sucesso!" });
});

// Rota: Atualizar um registro existente
app.put('/km/:id', async (req, res) => {
    const { id } = req.params;
    const { data, placa, km_inicio, km_final, km_total, rota, obs } = req.body;
    await db.run(
        "UPDATE registros_km SET data = ?, placa = ?, km_inicio = ?, km_final = ?, km_total = ?, rota = ?, obs = ? WHERE id = ?",
        [data, placa, km_inicio, km_final, km_total, rota, obs, id]
    );
    res.json({ mensagem: "Registro atualizado com sucesso!" });
});

// Rota: Excluir um registro
app.delete('/km/:id', async (req, res) => {
    const { id } = req.params;
    await db.run("DELETE FROM registros_km WHERE id = ?", [id]);
    res.json({ mensagem: "Registro excluído com sucesso!" });
});

app.listen(3000, () => console.log("Servidor do Controle de KM rodando na porta 3000"));
