import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit2, Trash2, Package, AlertTriangle, X,
  Barcode, DollarSign, Boxes, Tag
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLocale } from '../contexts/LocaleContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const { formatCurrency, t } = useLocale();

  const [form, setForm] = useState({
    name: '', description: '', price: '', cost: '', stock: '', min_stock: '',
    category_id: '', barcode: '', active: 1
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search, filterCategory, showLowStock]);

  const fetchProducts = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (showLowStock) params.low_stock = true;

      const response = await api.get('/products', { params });
      setProducts(response.data);
    } catch (error) {
      toast.error(t('errorLoadingProducts'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        cost: parseFloat(form.cost || 0),
        stock: parseInt(form.stock || 0),
        min_stock: parseInt(form.min_stock || 5),
        category_id: form.category_id ? parseInt(form.category_id) : null
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data);
        toast.success(t('productUpdated'));
      } else {
        await api.post('/products', data);
        toast.success(t('productCreated'));
      }
      setShowModal(false);
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', cost: '', stock: '', min_stock: '', category_id: '', barcode: '' });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || t('errorSavingProduct'));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      cost: product.cost || '',
      stock: product.stock,
      min_stock: product.min_stock,
      category_id: product.category_id || '',
      barcode: product.barcode || '',
      active: product.active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('errorRemovingProduct'))) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success(t('productRemoved'));
      fetchProducts();
    } catch (error) {
      toast.error(t('errorRemovingProduct'));
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('productsTitle')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('manageProducts')}</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setForm({ name: '', description: '', price: '', cost: '', stock: '', min_stock: '', category_id: '', barcode: '' }); setShowModal(true); }}
          className="btn-primary">
          <Plus className="w-5 h-5" /> {t('newProduct')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchProducts')}
            className="input-field pl-11 w-full"
          />
        </div>
        <select
          value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
            showLowStock
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          {t('lowStockBtn')}
        </button>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('product')}</th>
              <th>{t('category')}</th>
              <th>{t('price')}</th>
              <th>{t('stock')}</th>
              <th>{t('status')}</th>
              <th className="text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8">{t('loading')}</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">{t('noProductsFound')}</td></tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        {product.barcode && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Barcode className="w-3 h-3" /> {product.barcode}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {product.category_name ? (
                      <span className="badge" style={{
                        backgroundColor: product.category_color + '20',
                        color: product.category_color
                      }}>
                        {product.category_name}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="font-medium">{formatCurrency(product.price)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-gray-400" />
                      <span className={product.stock <= product.min_stock ? 'text-red-600 font-medium' : ''}>
                        {product.stock}
                      </span>
                      {product.stock <= product.min_stock && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${product.active ? 'badge-success' : 'badge-danger'}`}>
                      {product.active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(product)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
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
                  {editingProduct ? t('editProduct') : t('newProductModal')}
                </h2>
                <button onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name')} *</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="input-field" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      className="input-field" rows="2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('price')} *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                        className="input-field pl-11" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('cost')}</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="number" step="0.01" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})}
                        className="input-field pl-11" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('stock')} *</label>
                    <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                      className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('minStock')}</label>
                    <input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})}
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
                    <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
                      className="input-field">
                      <option value="">{t('selectCategory')}</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('barcode')}</label>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})}
                        className="input-field pl-11" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 btn-secondary justify-center">{t('cancel')}</button>
                  <button type="submit" className="flex-1 btn-primary justify-center">
                    {editingProduct ? t('saveProduct') : t('createProduct')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
