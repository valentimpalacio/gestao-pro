import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingBag, Package, Users, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { useLocale } from '../contexts/LocaleContext';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatCurrency, formatDate, currency, t } = useLocale();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const monthlyData = data?.monthlyRevenue?.map(item => ({
    month: formatDate(new Date(item.month + '-01'), 'MMM/yy'),
    revenue: parseFloat(item.revenue),
    sales: item.sales_count
  })) || [];

  const topProductsData = data?.topProducts?.map(item => ({
    name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
    vendas: parseInt(item.total_sold),
    revenue: parseFloat(item.revenue)
  })) || [];

  const paymentData = [
    { name: t('cash'), value: 30 },
    { name: t('creditCard'), value: 35 },
    { name: t('debitCard'), value: 15 },
    { name: t('pix'), value: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('overview')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-card px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border">
          <Calendar className="w-4 h-4" />
          {formatDate(new Date(), 'PPP')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('todaySales')}
          value={data?.today?.count || 0}
          subtitle={formatCurrency(data?.today?.total || 0)}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title={t('monthSales')}
          value={data?.month?.count || 0}
          subtitle={formatCurrency(data?.month?.total || 0)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title={t('products')}
          value={data?.products?.count || 0}
          subtitle={`${data?.lowStock?.count || 0} ${t('lowStock')}`}
          icon={Package}
          color="yellow"
        />
        <StatCard
          title={t('customersTitle')}
          value={data?.customers?.count || 0}
          subtitle={t('totalRegistered')}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <ChartCard title={t('monthlyRevenue')} className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${currency === 'BTC' ? '₿' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : 'R$'}${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value) => [formatCurrency(value), t('revenue')]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Payment Methods */}
        <ChartCard title={t('paymentMethods')}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {paymentData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <ChartCard title={t('topProducts')}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={11} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="vendas" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Recent Sales */}
        <ChartCard title={t('recentSales')}>
          <div className="space-y-3">
            {data?.recentSales?.map((sale, index) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    sale.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                    sale.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                    'bg-red-100 dark:bg-red-900/30 text-red-600'
                  }`}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('sale')} #{sale.id}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {sale.customer_name || t('unidentifiedCustomer')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(sale.total)}
                  </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(sale.created_at, 'dd/MM HH:mm')}
                    </p>
                </div>
              </motion.div>
            )) || (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {t('noRecentSales')}
              </p>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
