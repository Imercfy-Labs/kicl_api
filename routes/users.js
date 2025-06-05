const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role_id, branch_id FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    const { name, email } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role_id, branch_id',
            [name, email, req.user.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
});

module.exports = router;