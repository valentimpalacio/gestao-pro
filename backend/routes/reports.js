import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { generateSalesReportPDF, generateInventoryPDF } from '../utils/pdfGenerator.js';

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    // Sales today
    const [todaySales] = await pool.execute(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
       FROM sales WHERE user_id = ? AND DATE(created_at) = CURDATE() AND status = 'completed'`,
      [req.user.id]
    );

    // Sales this month
    const [monthSales] = await pool.execute(
      `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
       FROM sales WHERE user_id = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND status = 'completed'`,
      [req.user.id]
    );

    // Total products
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count, SUM(stock) as total_stock FROM products WHERE user_id = ? AND active = 1',
      [req.user.id]
    );

    // Low stock products
    const [lowStock] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE user_id = ? AND stock <= min_stock AND active = 1',
      [req.user.id]
    );

    // Total customers
    const [customers] = await pool.execute(
      'SELECT COUNT(*) as count FROM customers WHERE user_id = ?',
      [req.user.id]
    );

    // Monthly revenue (last 6 months)
    const [monthlyRevenue] = await pool.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total) as revenue, COUNT(*) as sales_count
       FROM sales
       WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) AND status = 'completed'
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`,
      [req.user.id]
    );

    // Top products
    const [topProducts] = await pool.execute(
      `SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.total) as revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.id
       JOIN sales s ON si.sale_id = s.id
       WHERE s.user_id = ? AND s.status = 'completed' AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 5`,
      [req.user.id]
    );

    // Recent sales
    const [recentSales] = await pool.execute(
      `SELECT s.*, c.name as customer_name
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    // Expenses this month
    const [monthExpenses] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
       WHERE user_id = ? AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`,
      [req.user.id]
    );

    res.json({
      today: todaySales[0],
      month: monthSales[0],
      products: products[0],
      lowStock: lowStock[0],
      customers: customers[0],
      monthlyRevenue,
      topProducts,
      recentSales,
      monthExpenses: monthExpenses[0]
    });
  } catch (error) {
    next(error);
  }
});

// Sales report with PDF
router.get('/sales', authenticate, async (req, res, next) => {
  try {
    const { start_date, end_date, format = 'json' } = req.query;

    let sql = `
      SELECT s.*, c.name as customer_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as items_count
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.user_id = ? AND s.status = 'completed'
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

    sql += ' ORDER BY s.created_at DESC';

    const [sales] = await pool.execute(sql, params);

    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, s) => sum + parseFloat(s.total), 0),
      totalDiscount: sales.reduce((sum, s) => sum + parseFloat(s.discount || 0), 0),
      averageTicket: sales.length > 0 ? sales.reduce((sum, s) => sum + parseFloat(s.total), 0) / sales.length : 0
    };

    if (format === 'pdf') {
      const pdf = await generateSalesReportPDF({ sales, summary }, { startDate: start_date, endDate: end_date });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio-vendas.pdf');
      res.send(pdf);
    } else {
      res.json({ sales, summary });
    }
  } catch (error) {
    next(error);
  }
});

// Inventory report with PDF
router.get('/inventory', authenticate, async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;

    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = ? AND p.active = 1
       ORDER BY p.name`,
      [req.user.id]
    );

    if (format === 'pdf') {
      const pdf = await generateInventoryPDF(products);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio-estoque.pdf');
      res.send(pdf);
    } else {
      res.json(products);
    }
  } catch (error) {
    next(error);
  }
});

// Financial report
router.get('/financial', authenticate, async (req, res, next) => {
  try {
    const { period = '30' } = req.query;

    const [revenue] = await pool.execute(
      `SELECT DATE(created_at) as date, SUM(total) as amount
       FROM sales
       WHERE user_id = ? AND status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [req.user.id, period]
    );

    const [expenses] = await pool.execute(
      `SELECT date, SUM(amount) as amount
       FROM expenses
       WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY date
       ORDER BY date`,
      [req.user.id, period]
    );

    const totalRevenue = revenue.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    res.json({
      revenue,
      expenses,
      summary: {
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
        margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
