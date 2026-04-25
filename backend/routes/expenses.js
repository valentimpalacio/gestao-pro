import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { start_date, end_date, category } = req.query;
    let sql = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [req.user.id];

    if (start_date) {
      sql += ' AND date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND date <= ?';
      params.push(end_date);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY date DESC';

    const [expenses] = await pool.execute(sql, params);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { description, amount, category, date } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO expenses (description, amount, category, date, user_id) VALUES (?, ?, ?, ?, ?)',
      [description, amount, category, date, req.user.id]
    );
    const [expenses] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json(expenses[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { description, amount, category, date } = req.body;
    await pool.execute(
      'UPDATE expenses SET description = ?, amount = ?, category = ?, date = ? WHERE id = ? AND user_id = ?',
      [description, amount, category, date, req.params.id, req.user.id]
    );
    const [expenses] = await pool.execute('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    res.json(expenses[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Despesa removida com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Summary by category
router.get('/stats/summary', authenticate, async (req, res, next) => {
  try {
    const { period = '30' } = req.query;

    const [byCategory] = await pool.execute(
      `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM expenses
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY category`,
      [req.user.id, period]
    );

    const [total] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [req.user.id, period]
    );

    res.json({ byCategory, total: total[0].total });
  } catch (error) {
    next(error);
  }
});

export default router;
