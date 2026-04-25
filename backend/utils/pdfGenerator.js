import puppeteer from 'puppeteer';

export const generateSalesReportPDF = async (data, filters = {}) => {
  const { sales, summary } = data;
  const { startDate, endDate } = filters;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1f2937; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #3B82F6; }
        .header h1 { color: #1e40af; font-size: 28px; margin-bottom: 8px; }
        .header p { color: #6b7280; font-size: 14px; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .summary-card { flex: 1; background: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border-left: 4px solid #3B82F6; }
        .summary-card h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
        .summary-card p { font-size: 24px; font-weight: bold; color: #1e40af; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #1e40af; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        tr:nth-child(even) { background: #f8fafc; }
        .status { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .payment-method { text-transform: capitalize; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Relatório de Vendas</h1>
        <p>Período: ${startDate || 'Início'} até ${endDate || 'Hoje'} | Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total de Vendas</h3>
          <p>${summary.totalSales}</p>
        </div>
        <div class="summary-card">
          <h3>Receita Total</h3>
          <p>R$ ${summary.totalRevenue.toFixed(2)}</p>
        </div>
        <div class="summary-card">
          <h3>Ticket Médio</h3>
          <p>R$ ${summary.averageTicket.toFixed(2)}</p>
        </div>
        <div class="summary-card">
          <h3>Descontos</h3>
          <p>R$ ${summary.totalDiscount.toFixed(2)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Método</th>
            <th>Itens</th>
            <th>Desconto</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${sales.map(sale => `
            <tr>
              <td>#${sale.id}</td>
              <td>${new Date(sale.created_at).toLocaleDateString('pt-BR')}</td>
              <td>${sale.customer_name || 'Cliente não identificado'}</td>
              <td class="payment-method">${translatePayment(sale.payment_method)}</td>
              <td>${sale.items_count}</td>
              <td>R$ ${parseFloat(sale.discount).toFixed(2)}</td>
              <td><strong>R$ ${parseFloat(sale.total).toFixed(2)}</strong></td>
              <td><span class="status status-${sale.status}">${translateStatus(sale.status)}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Sistema de Gestão para Pequenos Negócios | Relatório gerado automaticamente</p>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });
  await browser.close();

  return pdf;
};

export const generateInventoryPDF = async (products) => {
  const lowStock = products.filter(p => p.stock <= p.min_stock);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1f2937; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #10B981; }
        .header h1 { color: #065f46; font-size: 28px; margin-bottom: 8px; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .summary-card { flex: 1; background: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; }
        .summary-card:nth-child(1) { border-left: 4px solid #3B82F6; }
        .summary-card:nth-child(2) { border-left: 4px solid #10B981; }
        .summary-card:nth-child(3) { border-left: 4px solid #F59E0B; }
        .summary-card:nth-child(4) { border-left: 4px solid #EF4444; }
        .summary-card h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
        .summary-card p { font-size: 22px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #065f46; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        tr:nth-child(even) { background: #f8fafc; }
        .low-stock { background: #fee2e2 !important; }
        .stock-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .stock-ok { background: #d1fae5; color: #065f46; }
        .stock-low { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 Relatório de Estoque</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>

      <div class="summary">
        <div class="summary-card">
          <h3>Total de Produtos</h3>
          <p style="color: #3B82F6">${products.length}</p>
        </div>
        <div class="summary-card">
          <h3>Valor em Estoque</h3>
          <p style="color: #10B981">R$ ${totalValue.toFixed(2)}</p>
        </div>
        <div class="summary-card">
          <h3>Produtos Ativos</h3>
          <p style="color: #F59E0B">${products.filter(p => p.active).length}</p>
        </div>
        <div class="summary-card">
          <h3>Estoque Baixo</h3>
          <p style="color: #EF4444">${lowStock.length}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Custo</th>
            <th>Estoque</th>
            <th>Mínimo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr class="${p.stock <= p.min_stock ? 'low-stock' : ''}">
              <td><strong>${p.name}</strong><br><small>${p.barcode || 'Sem código'}</small></td>
              <td>${p.category_name || 'Sem categoria'}</td>
              <td>R$ ${parseFloat(p.price).toFixed(2)}</td>
              <td>R$ ${parseFloat(p.cost).toFixed(2)}</td>
              <td>${p.stock}</td>
              <td>${p.min_stock}</td>
              <td><span class="stock-badge ${p.stock <= p.min_stock ? 'stock-low' : 'stock-ok'}">${p.stock <= p.min_stock ? '⚠️ Baixo' : '✅ OK'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Sistema de Gestão para Pequenos Negócios | Relatório gerado automaticamente</p>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });
  await browser.close();

  return pdf;
};

function translatePayment(method) {
  const map = {
    cash: '💵 Dinheiro',
    credit_card: '💳 Cartão Crédito',
    debit_card: '💳 Cartão Débito',
    pix: '⚡ PIX',
    boleto: '📄 Boleto'
  };
  return map[method] || method;
}

function translateStatus(status) {
  const map = {
    completed: '✅ Concluída',
    pending: '⏳ Pendente',
    cancelled: '❌ Cancelada'
  };
  return map[status] || status;
}
