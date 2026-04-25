import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Search,
  DollarSign, CreditCard, QrCode, Receipt, User, Check
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useLocale } from '../contexts/LocaleContext';

const paymentMethods = [
  { id: 'cash', label: 'Dinheiro', icon: DollarSign },
  { id: 'credit_card', label: 'Cartão Crédito', icon: CreditCard },
  { id: 'debit_card', label: 'Cartão Débito', icon: CreditCard },
  { id: 'pix', label: 'PIX', icon: QrCode },
  { id: 'boleto', label: 'Boleto', icon: Receipt },
];

export default function NewSale() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const { formatCurrency } = useLocale();

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const params = search ? { search } : {};
      const response = await api.get('/products', { params });
      setProducts(response.data.filter(p => p.active && p.stock > 0));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Estoque insuficiente');
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        stock: product.stock
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.stock) {
          toast.error(t('insufficientStock'));
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  const handleSubmit = async () => {
      if (cart.length === 0) {
        toast.error(t('addProduct'));
        return;
      }

    setLoading(true);
    try {
      await api.post('/sales', {
        customer_id: selectedCustomer || null,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        discount: parseFloat(discount) || 0,
        payment_method: paymentMethod,
        notes
      });
      toast.success(t('saleSuccess'));
      navigate('/sales');
    } catch (error) {
       toast.error(error.response?.data?.message || t('errorProcessingSale'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/sales')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('newSaleTitle')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('newSaleSubtitle')}</p>
      </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchProductsPlaceholder')}
                className="input-field pl-11 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => (
              <motion.button
                key={product.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className="card p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{product.category_name}</p>
                  </div>
                  <span className="font-bold text-primary-600">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs ${product.stock <= product.min_stock ? 'text-red-500' : 'text-gray-500'}`}>
                      {t('stockLabel')}: {product.stock}
                    </span>
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary-600" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-4">
          {/* Cart */}
          <div className="card p-4">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5" />
              {t('cart')} ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t('emptyCart')}</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product_id, -1)}
                        className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, 1)}
                        className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.product_id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer */}
          <div className="card p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> {t('customerLabel')}
            </h3>
            <select
              value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}
              className="input-field"
            >
              <option value="">{t('unidentifiedCustomerLabel')}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment */}
          <div className="card p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('paymentMethod')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-lg border text-sm font-medium flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discount */}
          <div className="card p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('discountLabel')}</h3>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number" step="0.01" value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="input-field pl-11"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="card p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('notes')}</h3>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              className="input-field" rows="2"
              placeholder={t('notesPlaceholder')}
            />
          </div>

          {/* Totals */}
          <div className="card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('subtotal')}</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                 <span>{t('discountLabel')}</span>
                <span className="font-medium">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
               <span className="font-bold text-lg text-gray-900 dark:text-white">{t('total')}</span>
              <span className="font-bold text-lg text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || cart.length === 0}
            className="w-full btn-primary justify-center py-4 text-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <>
                 <Check className="w-5 h-5" />
                 {t('finalizeSale')}
               </>
             )}
          </button>
        </div>
      </div>
    </div>
  );
}
