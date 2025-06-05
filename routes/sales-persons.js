const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const router = express.Router();

// Create sales person
router.post('/', authenticateToken, async (req, res) => {
    const { name, email, password, phone, branch, territory, status } = req.body;

    try {
        // Check if email already exists
        const emailCheck = await pool.query(
            'SELECT * FROM sales_persons WHERE email = $1',
            [email]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create sales person
        const result = await pool.query(
            `INSERT INTO sales_persons (name, email, password_hash, phone, branch, territory, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, email, phone, branch, territory, status`,
            [name, email, password_hash, phone, branch, territory, status]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating sales person:', err);
        res.status(500).json({ message: 'Server error while creating sales person' });
    }
});

// Get all sales persons
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, phone, branch, territory, status FROM sales_persons ORDER BY name'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching sales persons:', err);
        res.status(500).json({ message: 'Server error while fetching sales persons' });
    }
});

module.exports = router;