import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM customers WHERE user_id = ?';
    const params = [req.user.id];

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR document LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY name';

    const [customers] = await pool.execute(sql, params);
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

// Get customer with purchase history
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    const [sales] = await pool.execute(
      `SELECT s.*, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as items_count
       FROM sales s WHERE s.customer_id = ? AND s.user_id = ? ORDER BY s.created_at DESC`,
      [req.params.id, req.user.id]
    );

    const [stats] = await pool.execute(
      `SELECT COUNT(*) as total_purchases, COALESCE(SUM(total), 0) as total_spent,
        MAX(created_at) as last_purchase
       FROM sales WHERE customer_id = ? AND user_id = ? AND status = 'completed'`,
      [req.params.id, req.user.id]
    );

    res.json({
      ...customers[0],
      sales,
      stats: stats[0]
    });
  } catch (error) {
    next(error);
  }
});

// Create customer
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, email, phone, document, address } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO customers (name, email, phone, document, address, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, document, address, req.user.id]
    );

    const [customers] = await pool.execute('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    res.status(201).json(customers[0]);
  } catch (error) {
    next(error);
  }
});

// Update customer
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, email, phone, document, address } = req.body;

    await pool.execute(
      'UPDATE customers SET name = ?, email = ?, phone = ?, document = ?, address = ? WHERE id = ? AND user_id = ?',
      [name, email, phone, document, address, req.params.id, req.user.id]
    );

    const [customers] = await pool.execute('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json(customers[0]);
  } catch (error) {
    next(error);
  }
});

// Delete customer
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM customers WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Cliente removido com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
