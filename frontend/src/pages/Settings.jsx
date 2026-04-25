import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Building2, Lock, Bell, Palette, Save, Check,
  Shield, Moon, Sun, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocale } from '../contexts/LocaleContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { 
    language, 
    currency, 
    changeLanguage, 
    changeCurrency, 
    languages, 
    currencies,
    t
  } = useLocale();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    company_name: user?.company_name || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success(t('profileUpdated'));
    } catch (error) {
      toast.error(t('errorUpdatingProfile'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('passwordMinLength'));
      return;
    }

    setSaving(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success(t('passwordChanged'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || t('errorChangingPassword'));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'security', label: t('security'), icon: Shield },
    { id: 'appearance', label: t('appearance'), icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('settingsSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <User className="w-5 h-5" /> {t('profileInfo')}
              </h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('name')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text" value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      className="input-field pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('companyName')}
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text" value={profileForm.company_name}
                      onChange={(e) => setProfileForm({...profileForm, company_name: e.target.value})}
                      className="input-field pl-11"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('email')}
                  </label>
                  <input
                    type="email" value={user?.email || ''}
                    disabled
                    className="input-field bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save className="w-4 h-4" /> {t('saveChanges')}</>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5" /> {t('changePassword')}
              </h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('currentPassword')}
                  </label>
                  <input
                    type="password" value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('newPassword')}
                  </label>
                  <input
                    type="password" value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="input-field"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('confirmPassword')}
                  </label>
                  <input
                    type="password" value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Lock className="w-4 h-4" /> {t('changePassword')}</>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Palette className="w-5 h-5" /> {t('theme')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => { if (theme === 'dark') toggleTheme(); }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                    <p className="font-medium text-gray-900 dark:text-white">{t('light')}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('lightDesc')}</p>
                  </button>
                  <button
                    onClick={() => { if (theme === 'light') toggleTheme(); }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Moon className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                    <p className="font-medium text-gray-900 dark:text-white">{t('dark')}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('darkDesc')}</p>
                  </button>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" /> {t('languageRegion')}
                </h2>
                <div className="space-y-4 max-w-lg">
                   <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('language')}
                   </label>
                     <select 
                       className="input-field" 
                       value={language}
                       onChange={(e) => changeLanguage(e.target.value)}
                     >
                       {languages.map((lang) => (
                         <option key={lang.value} value={lang.value}>
                           {lang.label}
                         </option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('currency')}
                     </label>
                     <select 
                       className="input-field" 
                       value={currency}
                       onChange={(e) => changeCurrency(e.target.value)}
                     >
                       {currencies.map((curr) => (
                         <option key={curr.value} value={curr.value}>
                           {curr.label} ({curr.symbol})
                         </option>
                       ))}
                     </select>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
