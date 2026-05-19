import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

export const setupDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('🔧 Criando banco de dados...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'gestao_negocios'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE ${process.env.DB_NAME || 'gestao_negocios'}`);

    console.log('🔧 Criando tabelas...');

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'seller') DEFAULT 'admin',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2) DEFAULT 0,
        stock INT DEFAULT 0,
        min_stock INT DEFAULT 5,
        category_id INT,
        barcode VARCHAR(100),
        user_id INT NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Customers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        document VARCHAR(50),
        address TEXT,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Sales table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        user_id INT NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) DEFAULT 0,
        payment_method ENUM('cash', 'credit_card', 'debit_card', 'pix', 'boleto') NOT NULL,
        status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Sale items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Expenses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('🔧 Inserindo dados de exemplo...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.execute(`
      INSERT IGNORE INTO users (id, name, email, password, company_name, role)
      VALUES (1, 'Administrador', 'admin@gestao.com', ?, 'Minha Empresa', 'admin')
    `, [hashedPassword]);

    // Insert sample categories
    await connection.execute(`
      INSERT IGNORE INTO categories (id, name, description, color, user_id) VALUES
      (1, 'Eletrônicos', 'Produtos eletrônicos e tecnologia', '#3B82F6', 1),
      (2, 'Roupas', 'Vestuário e acessórios', '#EC4899', 1),
      (3, 'Alimentos', 'Produtos alimentícios', '#10B981', 1),
      (4, 'Casa & Decoração', 'Itens para casa', '#F59E0B', 1)
    `);

    // Insert sample products
    await connection.execute(`
      INSERT IGNORE INTO products (id, name, description, price, cost, stock, min_stock, category_id, barcode, user_id) VALUES
      (1, 'Smartphone Galaxy Pro', 'Celular Android 128GB', 2499.90, 1800.00, 15, 5, 1, '7891234567890', 1),
      (2, 'Notebook Ultra', 'Notebook i5 16GB RAM SSD 512GB', 4599.00, 3200.00, 8, 3, 1, '7891234567891', 1),
      (3, 'Fone Bluetooth', 'Fone sem fio com cancelamento de ruído', 299.90, 150.00, 45, 10, 1, '7891234567892', 1),
      (4, 'Camiseta Premium', 'Camiseta 100% algodão', 89.90, 35.00, 120, 20, 2, '7891234567893', 1),
      (5, 'Calça Jeans', 'Calça jeans slim fit', 159.90, 70.00, 60, 15, 2, '7891234567894', 1),
      (6, 'Café Especial', 'Café gourmet 500g', 29.90, 15.00, 200, 50, 3, '7891234567895', 1),
      (7, 'Chocolate Premium', 'Chocolate 70% cacau', 19.90, 8.00, 150, 30, 3, '7891234567896', 1),
      (8, 'Luminária LED', 'Luminária de mesa moderna', 129.90, 60.00, 25, 5, 4, '7891234567897', 1)
    `);

    // Insert sample customers
    await connection.execute(`
      INSERT IGNORE INTO customers (id, name, email, phone, document, user_id) VALUES
      (1, 'João Silva', 'joao@email.com', '(11) 98765-4321', '123.456.789-00', 1),
      (2, 'Maria Santos', 'maria@email.com', '(11) 98765-4322', '987.654.321-00', 1),
      (3, 'Pedro Costa', 'pedro@email.com', '(11) 98765-4323', '456.789.123-00', 1)
    `);

    // Insert sample sales
    await connection.execute(`
      INSERT IGNORE INTO sales (id, customer_id, user_id, total, discount, payment_method, status, created_at) VALUES
      (1, 1, 1, 2799.80, 0, 'credit_card', 'completed', DATE_SUB(NOW(), INTERVAL 5 DAY)),
      (2, 2, 1, 89.90, 0, 'pix', 'completed', DATE_SUB(NOW(), INTERVAL 4 DAY)),
      (3, 1, 1, 319.80, 10.00, 'cash', 'completed', DATE_SUB(NOW(), INTERVAL 3 DAY)),
      (4, 3, 1, 4599.00, 0, 'debit_card', 'completed', DATE_SUB(NOW(), INTERVAL 2 DAY)),
      (5, 2, 1, 149.80, 0, 'pix', 'completed', DATE_SUB(NOW(), INTERVAL 1 DAY))
    `);

    // Insert sample sale items
    await connection.execute(`
      INSERT IGNORE INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
      (1, 1, 1, 1, 2499.90, 2499.90),
      (2, 1, 3, 1, 299.90, 299.90),
      (3, 2, 4, 1, 89.90, 89.90),
      (4, 3, 3, 1, 299.90, 299.90),
      (5, 3, 6, 1, 29.90, 29.90),
      (6, 4, 2, 1, 4599.00, 4599.00),
      (7, 5, 5, 1, 159.90, 159.90)
    `);

    // Insert sample expenses
    await connection.execute(`
      INSERT IGNORE INTO expenses (id, description, amount, category, date, user_id) VALUES
      (1, 'Aluguel do mês', 2500.00, 'fixed', CURDATE(), 1),
      (2, 'Energia elétrica', 450.00, 'fixed', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1),
      (3, 'Marketing digital', 800.00, 'marketing', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 1),
      (4, 'Material de escritório', 120.00, 'operational', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1)
    `);

    console.log('✅ Banco de dados configurado com sucesso!');
    console.log('👤 Usuário padrão: admin@gestao.com / admin123');

    await connection.end();
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados:', error);
    throw error;
  }
};

// Allow running standalone via: node scripts/setupDatabase.js
if (process.argv[1] && process.argv[1].includes('setupDatabase')) {
  setupDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
