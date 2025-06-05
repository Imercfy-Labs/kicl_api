const express = require('express');
const router = express.Router();
const pool = require('../db');
const ROLES = {
    ADMIN: 1,
    SALES: 5
};

// POST /api/orders - Salesperson places an order
router.post('/', async (req, res) => {
    const { dealer_id, sales_officer_id, branch_id, items } = req.body;

    if (!dealer_id || !sales_officer_id || !branch_id || !items || items.length === 0) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderRes = await client.query(
            `INSERT INTO orders (dealer_id, sales_officer_id, branch_id)
       VALUES ($1, $2, $3) RETURNING id, created_at`,
            [dealer_id, sales_officer_id, branch_id]
        );
        const order_id = orderRes.rows[0].id;

        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
                [order_id, item.product_id, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');
        res.json({ order_id, message: 'Order created successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Order creation failed' });
    } finally {
        client.release();
    }
});

// GET /api/orders/summary - Admin/Salesperson views orders
router.get('/summary', async (req, res) => {
    const { role, id: user_id } = req.user; // from JWT token
    const values = [];
    let condition = '';

    // If the user is a Sales Person, restrict the data
    if (req.user.role === ROLES.SALES) {
        condition = `WHERE o.sales_officer_id = $1`;
        values.push(req.user.id);
    }
    // If Admin, no WHERE clause — see all orders

    const query = `
    SELECT
      o.id AS order_id,
      o.created_at::date,
      d.name AS dealer_name,
      d.id AS dealer_id,
      d.credit_limit,
      u.name AS sales_officer_name,
      json_agg(json_build_object(
        'product_name', p.name,
        'quantity', oi.quantity,
        'price', oi.price
      )) AS products,
      SUM(oi.quantity * oi.price)::numeric(12,2) AS total_amount
    FROM orders o
    JOIN dealers d ON o.dealer_id = d.id
    JOIN users u ON o.sales_officer_id = u.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    ${condition}
    GROUP BY o.id, d.name, d.id, d.credit_limit, u.name
    ORDER BY o.created_at DESC;
  `;

    try {
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error('Summary fetch error:', err);
        res.status(500).json({ message: 'Could not fetch order summary' });
    }
});

module.exports = router;
