import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { saleValidation } from '../middleware/validate.js';

const router = express.Router();

// Get all sales
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { start_date, end_date, status, payment_method, customer_id } = req.query;
    let sql = `
      SELECT s.*, c.name as customer_name, u.name as seller_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as items_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `;
    const params = [req.user.id];

    if (start_date) {
      sql += ' AND DATE(s.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND DATE(s.created_at) <= ?';
      params.push(end_date);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }
    if (payment_method) {
      sql += ' AND s.payment_method = ?';
      params.push(payment_method);
    }
    if (customer_id) {
      sql += ' AND s.customer_id = ?';
      params.push(customer_id);
    }

    sql += ' ORDER BY s.created_at DESC';

    const [sales] = await pool.execute(sql, params);
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

// Get sale details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [sales] = await pool.execute(
      `SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (sales.length === 0) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }

    const [items] = await pool.execute(
      `SELECT si.*, p.name as product_name, p.barcode
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );

    res.json({ ...sales[0], items });
  } catch (error) {
    next(error);
  }
});

// Create sale
router.post('/', authenticate, saleValidation, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_id, items, discount, payment_method, notes } = req.body;
    let total = 0;

    // Calculate total and validate stock
    for (const item of items) {
      const [products] = await connection.execute(
        'SELECT price, stock, name FROM products WHERE id = ? AND user_id = ? AND active = 1',
        [item.product_id, req.user.id]
      );

      if (products.length === 0) {
        throw new Error(`Produto ID ${item.product_id} não encontrado`);
      }

      if (products[0].stock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${products[0].name}. Disponível: ${products[0].stock}`);
      }

      item.price = products[0].price;
      item.total = item.price * item.quantity;
      total += item.total;
    }

    const finalTotal = total - (discount || 0);

    // Create sale
    const [saleResult] = await connection.execute(
      `INSERT INTO sales (customer_id, user_id, total, discount, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_id || null, req.user.id, finalTotal, discount || 0, payment_method, notes]
    );

    // Create sale items and update stock
    for (const item of items) {
      await connection.execute(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price, total)
         VALUES (?, ?, ?, ?, ?)`,
        [saleResult.insertId, item.product_id, item.quantity, item.price, item.total]
      );

      await connection.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    const [sale] = await pool.execute('SELECT * FROM sales WHERE id = ?', [saleResult.insertId]);
    res.status(201).json(sale[0]);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// Cancel sale
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [sales] = await connection.execute(
      'SELECT * FROM sales WHERE id = ? AND user_id = ? AND status = "completed"',
      [req.params.id, req.user.id]
    );

    if (sales.length === 0) {
      return res.status(404).json({ message: 'Venda não encontrada ou já cancelada' });
    }

    // Restore stock
    const [items] = await connection.execute(
      'SELECT * FROM sale_items WHERE sale_id = ?',
      [req.params.id]
    );

    for (const item of items) {
      await connection.execute(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.execute(
      'UPDATE sales SET status = "cancelled" WHERE id = ?',
      [req.params.id]
    );

    await connection.commit();
    res.json({ message: 'Venda cancelada com sucesso' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// Get sales summary
router.get('/stats/summary', authenticate, async (req, res, next) => {
  try {
    const { period = '7' } = req.query; // days

    const [today] = await pool.execute(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
       FROM sales WHERE user_id = ? AND DATE(created_at) = CURDATE() AND status = 'completed'`,
      [req.user.id]
    );

    const [week] = await pool.execute(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
       FROM sales WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND status = 'completed'`,
      [req.user.id, period]
    );

    const [month] = await pool.execute(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
       FROM sales WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'completed'`,
      [req.user.id]
    );

    const [paymentMethods] = await pool.execute(
      `SELECT payment_method, COUNT(*) as count, SUM(total) as total
       FROM sales WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND status = 'completed'
       GROUP BY payment_method`,
      [req.user.id, period]
    );

    res.json({
      today: today[0],
      week: week[0],
      month: month[0],
      paymentMethods
    });
  } catch (error) {
    next(error);
  }
});

export default router;
