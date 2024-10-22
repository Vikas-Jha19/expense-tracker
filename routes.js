// routes.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const { authenticateJWT } = require('./users'); // Import authenticateJWT

// POST /transactions - Add a new transaction
router.post('/transactions', authenticateJWT, (req, res) => {
    const { type, category, amount, date, description } = req.body;
    const userId = req.user.id; // Get user ID from the authenticated user
    const sql = 'INSERT INTO transactions (user_id, type, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)';

    db.run(sql, [userId, type, category, amount, date, description], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, ...req.body });
    });
});

// GET /transactions - Retrieve all transactions with pagination
router.get('/transactions', authenticateJWT, (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Get pagination parameters
    const offset = (page - 1) * limit; // Calculate offset

    const sql = `SELECT * FROM transactions WHERE user_id = ? LIMIT ? OFFSET ?`;
    db.all(sql, [req.user.id, limit, offset], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /transactions/:id - Retrieve a transaction by ID
router.get('/transactions/:id', authenticateJWT, (req, res) => {
    const query = `SELECT * FROM transactions WHERE id = ? AND user_id = ?`;
    db.get(query, [req.params.id, req.user.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(row);
    });
});

// PUT /transactions/:id - Update a transaction by ID
router.put('/transactions/:id', authenticateJWT, (req, res) => {
    const { type, category, amount, date, description } = req.body;
    if (!type || !category || !amount || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const query = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ? AND user_id = ?`;
    db.run(query, [type, category, amount, date, description || '', req.params.id, req.user.id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction updated' });
    });
});

// DELETE /transactions/:id - Delete a transaction by ID
router.delete('/transactions/:id', authenticateJWT, (req, res) => {
    const query = `DELETE FROM transactions WHERE id = ? AND user_id = ?`;
    db.run(query, [req.params.id, req.user.id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted' });
    });
});

// GET /summary - Get a summary of transactions
router.get('/summary', authenticateJWT, (req, res) => {
    const query = `
        SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
            (SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) AS balance
        FROM transactions
        WHERE user_id = ?
    `;
    db.get(query, [req.user.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// GET /reports/monthly - Get monthly spending by category
router.get('/reports/monthly', authenticateJWT, (req, res) => {
    const query = `
        SELECT 
            category,
            SUM(amount) AS total_spent
        FROM transactions
        WHERE user_id = ?
        GROUP BY category
    `;
    db.all(query, [req.user.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;
