import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, Eye, XCircle, ShoppingBag, Calendar,
  CreditCard, DollarSign, QrCode, Receipt
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLocale } from '../contexts/LocaleContext';

const paymentIcons = {
  cash: DollarSign,
  credit_card: CreditCard,
  debit_card: CreditCard,
  pix: QrCode,
  boleto: Receipt
};

const statusColors = {
  completed: 'badge-success',
  pending: 'badge-warning',
  cancelled: 'badge-danger'
};

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigate = useNavigate();
  const { formatCurrency, formatDate, t } = useLocale();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const params = {};
      if (dateRange.start) params.start_date = dateRange.start;
      if (dateRange.end) params.end_date = dateRange.end;

      const response = await api.get('/sales', { params });
      setSales(response.data);
    } catch (error) {
      toast.error(t('errorLoadingSales'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm(t('cancelSaleConfirm'))) return;
    try {
      await api.patch(`/sales/${id}/cancel`);
      toast.success(t('saleCancelled'));
      fetchSales();
    } catch (error) {
      toast.error(t('errorCancellingSale'));
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    sale.id.toString().includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sales')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('salesHistory')}</p>
        </div>
        <button onClick={() => navigate('/sales/new')} className="btn-primary">
          <Plus className="w-5 h-5" /> {t('newSale')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchSales')}
            className="input-field pl-11 w-full"
          />
        </div>
        <input
          type="date" value={dateRange.start}
          onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
          className="input-field w-full sm:w-auto"
        />
        <input
          type="date" value={dateRange.end}
          onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
          className="input-field w-full sm:w-auto"
        />
        <button onClick={fetchSales} className="btn-secondary">{t('filter')}</button>
      </div>

      {/* Sales Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('saleTable')}</th>
              <th>{t('client')}</th>
              <th>{t('date')}</th>
              <th>{t('payment')}</th>
              <th>{t('items')}</th>
              <th>{t('total')}</th>
              <th>{t('status')}</th>
              <th className="text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-8">{t('loading')}</td></tr>
            ) : filteredSales.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-8 text-gray-500">{t('noSalesFound')}</td></tr>
            ) : (
              filteredSales.map((sale) => {
                const PaymentIcon = paymentIcons[sale.payment_method] || DollarSign;
                return (
                  <motion.tr
                    key={sale.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">#{sale.id}</span>
                      </div>
                    </td>
                    <td className="text-gray-700 dark:text-gray-300">
                      {sale.customer_name || t('unidentifiedCustomer')}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {formatDate(sale.created_at, 'dd/MM/yyyy HH:mm')}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <PaymentIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                           {t(sale.payment_method)}
                        </span>
                      </div>
                    </td>
                    <td>{sale.items_count} {t('items')}</td>
                    <td className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(sale.total)}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[sale.status]}`}>
                       {t(sale.status)}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {/* View details */}}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {sale.status === 'completed' && (
                          <button
                            onClick={() => handleCancel(sale.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                            title={t('cancel')}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
