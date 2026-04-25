import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import { translations } from './translations';

const dateFnsLocales = {
  'pt-BR': ptBR,
  'es-ES': es,
  'en-US': enUS
};

const LocaleContext = createContext();

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};

export const LocaleProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'pt-BR';
  });

  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('currency');
    return saved || 'BRL';
  });

  const [exchangeRates, setExchangeRates] = useState(() => {
    const saved = localStorage.getItem('exchangeRates');
    return saved ? JSON.parse(saved) : null;
  });

  // Buscar taxas de câmbio (base BRL)
  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/BRL');
      const data = await response.json();
      if (data && data.rates) {
        setExchangeRates(data.rates);
        localStorage.setItem('exchangeRates', JSON.stringify(data.rates));
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  }, []);

  // Buscar cotação do Bitcoin em BRL
  const fetchBitcoinRate = useCallback(async () => {
    try {
      // Usar CoinGecko API para obter cotação do Bitcoin em BRL
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl');
      const data = await response.json();
      if (data && data.bitcoin && data.bitcoin.brl) {
        const btcRate = data.bitcoin.brl;
        // Atualizar exchangeRates com a taxa do Bitcoin (quantos BTC por BRL)
        setExchangeRates(prev => {
          const newRates = { ...prev, BTC: 1 / btcRate };
          localStorage.setItem('exchangeRates', JSON.stringify(newRates));
          return newRates;
        });
      }
    } catch (error) {
      console.error('Error fetching Bitcoin rate:', error);
    }
  }, []);

  // Buscar taxas ao montar e uma vez por dia
  useEffect(() => {
    if (!exchangeRates) {
      fetchExchangeRates();
    }
    // Sempre buscar cotação do Bitcoin
    fetchBitcoinRate();
  }, [exchangeRates, fetchExchangeRates, fetchBitcoinRate]);

  // Persistir configurações no localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
  };

  // Dados disponíveis para idiomas e moedas
  const languages = useMemo(() => [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'es-ES', label: 'Espanhol' },
    { value: 'en-US', label: 'Inglês' }
  ], []);

  const currencies = useMemo(() => [
    { value: 'BRL', label: 'Real Brasileiro', symbol: 'R$' },
    { value: 'USD', label: 'Dólar Americano', symbol: 'US$' },
    { value: 'CNY', label: 'Yuan Chinês', symbol: '¥' },
    { value: 'GBP', label: 'Libra Esterlina', symbol: '£' },
    { value: 'EUR', label: 'Euro', symbol: '€' },
    { value: 'BTC', label: 'Bitcoin', symbol: '₿' }
  ], []);

  const dateLocale = dateFnsLocales[language] || ptBR;

  // Função de tradução
  const t = useCallback((key) => {
    const dict = translations[language] || translations['pt-BR'];
    return dict[key] || key;
  }, [language]);

  // Converter valor de BRL para a moeda selecionada
  const convertCurrency = useCallback((value) => {
    if (currency === 'BRL' || !exchangeRates) return value;
    const rate = exchangeRates[currency];
    if (!rate) return value;
    return value * rate;
  }, [currency, exchangeRates]);

  const formatCurrency = useCallback((value) => {
    const converted = convertCurrency(value);
    // Para Bitcoin, usar formatação personalizada
    if (currency === 'BTC') {
      return `₿${converted.toFixed(8)}`;
    }
    return new Intl.NumberFormat(language, { style: 'currency', currency }).format(converted);
  }, [language, currency, convertCurrency]);

  const formatDate = useCallback((date, formatStr = 'dd/MM/yyyy') => {
    return format(new Date(date), formatStr, { locale: dateLocale });
  }, [dateLocale]);

  const value = useMemo(() => ({
    language,
    currency,
    changeLanguage,
    changeCurrency,
    languages,
    currencies,
    dateLocale,
    formatCurrency,
    formatDate,
    t,
    convertCurrency,
    getCurrentLanguage: () => languages.find(lang => lang.value === language),
    getCurrentCurrency: () => currencies.find(curr => curr.value === currency)
  }), [language, currency, languages, currencies, dateLocale, formatCurrency, formatDate, t, convertCurrency]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};
