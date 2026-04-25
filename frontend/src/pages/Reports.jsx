import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileText, Package, TrendingUp, Calendar,
  DollarSign, BarChart3
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { useLocale } from '../contexts/LocaleContext';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { formatCurrency, formatDate, currency } = useLocale();

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.start) params.start_date = dateRange.start;
      if (dateRange.end) params.end_date = dateRange.end;
      const response = await api.get('/reports/sales', { params });
      setSalesData(response.data);
    } catch (error) {
      toast.error(t('errorLoadingSalesReport'));
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/inventory');
      setInventoryData(response.data);
    } catch (error) {
      toast.error(t('errorLoadingInventoryReport'));
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/financial');
      setFinancialData(response.data);
    } catch (error) {
      toast.error(t('errorLoadingFinancialReport'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales') fetchSalesReport();
    else if (activeTab === 'inventory') fetchInventoryReport();
    else if (activeTab === 'financial') fetchFinancialReport();
  }, [activeTab]);

  const downloadPDF = async (type) => {
    try {
      const params = { format: 'pdf' };
      if (dateRange.start) params.start_date = dateRange.start;
      if (dateRange.end) params.end_date = dateRange.end;

      const response = await api.get(`/reports/${type}`, {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${type}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('pdfDownloaded'));
    } catch (error) {
      toast.error(t('errorGeneratingPDF'));
    }
  };


  const tabs = [
    { id: 'sales', label: t('salesReport'), icon: FileText },
    { id: 'inventory', label: t('inventoryReport'), icon: Package },
    { id: 'financial', label: t('financialReport'), icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports')}</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">{t('reportsSubtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-dark-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Filter */}
      {activeTab === 'sales' && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date" value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="input-field"
          />
          <input
            type="date" value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="input-field"
          />
      <button onClick={fetchSalesReport} className="btn-secondary">{t('update')}</button>
      <button onClick={() => downloadPDF('sales')} className="btn-primary">
        <Download className="w-4 h-4" /> {t('downloadPDF')}
      </button>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="flex justify-end">
        <button onClick={() => downloadPDF('inventory')} className="btn-primary">
          <Download className="w-4 h-4" /> {t('downloadPDF')}
        </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : activeTab === 'sales' && salesData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-500">Total de Vendas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{salesData.summary.totalSales}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Receita Total</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(salesData.summary.totalRevenue)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(salesData.summary.averageTicket)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Descontos</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(salesData.summary.totalDiscount)}</p>
            </div>
          </div>

          {/* Sales Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('id')}</th>
                  <th>{t('date')}</th>
                  <th>{t('customer')}</th>
                  <th>{t('items')}</th>
                  <th>{t('discount')}</th>
                  <th>{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {salesData.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>#{sale.id}</td>
                    <td>{formatDate(sale.created_at, 'dd/MM/yyyy')}</td>
                    <td>{sale.customer_name || 'N/A'}</td>
                    <td>{sale.items_count}</td>
                    <td>{formatCurrency(sale.discount)}</td>
                    <td className="font-semibold">{formatCurrency(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'inventory' && inventoryData ? (
        <div className="space-y-6">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('product')}</th>
                  <th>{t('category')}</th>
                  <th>{t('price')}</th>
                  <th>{t('stock')}</th>
                  <th>{t('minStock')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((product) => (
                  <tr key={product.id} className={product.stock <= product.min_stock ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                    <td className="font-medium">{product.name}</td>
                    <td>{product.category_name || '-'}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td className={product.stock <= product.min_stock ? 'text-red-600 font-bold' : ''}>{product.stock}</td>
                    <td>{product.min_stock}</td>
                    <td>
                      <span className={`badge ${product.stock <= product.min_stock ? 'badge-danger' : 'badge-success'}`}>
                        {product.stock <= product.min_stock ? t('lowStockStatus') : t('okStatus')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'financial' && financialData ? (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-500">Receita</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(financialData.summary.totalRevenue)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Despesas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(financialData.summary.totalExpenses)}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-500">Lucro</p>
              <p className={`text-2xl font-bold ${financialData.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financialData.summary.profit)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Margem: {financialData.summary.margin}%</p>
            </div>
          </div>

          {/* Chart */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('revenueVsExpenses')}</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData.revenue.map((r, i) => ({
                  date: formatDate(r.date, 'dd/MM'),
                  receita: parseFloat(r.amount),
                  despesa: parseFloat(financialData.expenses[i]?.amount || 0)
                }))}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${currency === 'BTC' ? '₿' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : 'R$'}${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    formatter={(value) => [formatCurrency(value)]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="receita" stroke="#10B981" fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesa" stroke="#EF4444" fill="url(#colorExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
