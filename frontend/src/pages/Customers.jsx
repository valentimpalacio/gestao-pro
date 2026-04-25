import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, User, Phone, Mail, MapPin,
  X, ShoppingBag, DollarSign, Calendar
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLocale } from '../contexts/LocaleContext';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const { formatCurrency, formatDate, t } = useLocale();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', document: '', address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/customers', { params });
      setCustomers(response.data);
    } catch (error) {
      toast.error(t('errorLoadingCustomers'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, form);
        toast.success(t('customerUpdated'));
      } else {
        await api.post('/customers', form);
        toast.success(t('customerCreated'));
      }
      setShowModal(false);
      setEditingCustomer(null);
      setForm({ name: '', email: '', phone: '', document: '', address: '' });
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || t('errorSavingCustomer'));
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      document: customer.document || '',
      address: customer.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('errorRemovingCustomer'))) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success(t('customerRemoved'));
      fetchCustomers();
    } catch (error) {
      toast.error(t('errorRemovingCustomer'));
    }
  };

  const viewCustomer = async (customer) => {
    try {
      const response = await api.get(`/customers/${customer.id}`);
      setViewingCustomer(response.data);
    } catch (error) {
      toast.error(t('errorLoadingCustomers'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('customersTitle')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('manageCustomers')}</p>
        </div>
        <button onClick={() => { setEditingCustomer(null); setForm({ name: '', email: '', phone: '', document: '', address: '' }); setShowModal(true); }}
          className="btn-primary">
          <Plus className="w-5 h-5" /> {t('newCustomer')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchCustomers')}
          className="input-field pl-11 w-full"
        />
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="text-center py-8">{t('loading')}</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">{t('noCustomersFound')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <motion.div
              key={customer.id}
              whileHover={{ y: -2 }}
              className="card p-5 cursor-pointer"
              onClick={() => viewCustomer(customer)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                    {customer.document && (
                      <p className="text-xs text-gray-500">{customer.document}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    {customer.phone}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    {customer.address}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content"
            >
              <div className="p-6 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCustomer ? t('editCustomer') : t('newCustomerModal')}
                </h2>
                <button onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name')} *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="input-field" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('phone')}</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('document')}</label>
                    <input type="text" value={form.document} onChange={e => setForm({...form, document: e.target.value})}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address')}</label>
                    <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                      className="input-field" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 btn-secondary justify-center">{t('cancel')}</button>
                  <button type="submit" className="flex-1 btn-primary justify-center">
                    {editingCustomer ? t('save') : t('createCustomer')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Customer Modal */}
      <AnimatePresence>
        {viewingCustomer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content max-w-2xl"
            >
              <div className="p-6 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('customerDetails')}</h2>
                <button onClick={() => setViewingCustomer(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{viewingCustomer.name}</h3>
                    <p className="text-gray-500">{viewingCustomer.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="card p-4 text-center">
                    <ShoppingBag className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{viewingCustomer.stats?.total_purchases || 0}</p>
                    <p className="text-sm text-gray-500">{t('purchases')}</p>
                  </div>
                  <div className="card p-4 text-center">
                    <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(viewingCustomer.stats?.total_spent || 0)}
                    </p>
                    <p className="text-sm text-gray-500">{t('totalSpent')}</p>
                  </div>
                </div>

                {viewingCustomer.sales?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('purchaseHistory')}</h4>
                    <div className="space-y-2">
                      {viewingCustomer.sales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                            <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t('sale')} #{sale.id}</p>
                              <p className="text-xs text-gray-500">
                                {formatDate(sale.created_at, 'dd/MM/yyyy')}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(sale.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
