import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { productValidation } from '../middleware/validate.js';

const router = express.Router();

// Get all products with category
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { search, category, low_stock, active } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.user_id = ?
    `;
    const params = [req.user.id];

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND p.category_id = ?';
      params.push(category);
    }
    if (low_stock === 'true') {
      sql += ' AND p.stock <= p.min_stock';
    }
    if (active !== undefined) {
      sql += ' AND p.active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    sql += ' ORDER BY p.created_at DESC';

    const [products] = await pool.execute(sql, params);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// Get single product
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    res.json(products[0]);
  } catch (error) {
    next(error);
  }
});

// Create product
router.post('/', authenticate, productValidation, async (req, res, next) => {
  try {
    const { name, description, price, cost, stock, min_stock, category_id, barcode } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO products (name, description, price, cost, stock, min_stock, category_id, barcode, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, cost || 0, stock || 0, min_stock || 5, category_id || null, barcode, req.user.id]
    );

    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json(products[0]);
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, description, price, cost, stock, min_stock, category_id, barcode, active } = req.body;

    await pool.execute(
      `UPDATE products SET
        name = ?, description = ?, price = ?, cost = ?, stock = ?,
        min_stock = ?, category_id = ?, barcode = ?, active = ?
       WHERE id = ? AND user_id = ?`,
      [name, description, price, cost, stock, min_stock, category_id, barcode, active, req.params.id, req.user.id]
    );

    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    res.json(products[0]);
  } catch (error) {
    next(error);
  }
});

// Delete product (soft delete)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await pool.execute(
      'UPDATE products SET active = 0 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Update stock
router.patch('/:id/stock', authenticate, async (req, res, next) => {
  try {
    const { quantity, type } = req.body; // type: 'add' or 'remove'
    const operator = type === 'add' ? '+' : '-';

    await pool.execute(
      `UPDATE products SET stock = stock ${operator} ? WHERE id = ? AND user_id = ?`,
      [quantity, req.params.id, req.user.id]
    );

    const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(products[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
