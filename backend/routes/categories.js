import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const [categories] = await pool.execute(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.active = 1
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.name`,
      [req.user.id]
    );
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, color, user_id) VALUES (?, ?, ?, ?)',
      [name, description, color || '#3B82F6', req.user.id]
    );
    const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(categories[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    await pool.execute(
      'UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ? AND user_id = ?',
      [name, description, color, req.params.id, req.user.id]
    );
    const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    res.json(categories[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Categoria removida com sucesso' });
  } catch (error) {
    next(error);
  }
});

export default router;
