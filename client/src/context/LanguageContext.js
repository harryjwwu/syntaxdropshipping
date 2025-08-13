import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // 默认英语

  useEffect(() => {
    // 从本地存储加载语言设置
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && ['en', 'zh', 'sv', 'da', 'no', 'fi', 'is', 'es', 'fr', 'de', 'pt'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (newLanguage) => {
    if (['en', 'zh', 'sv', 'da', 'no', 'fi', 'is', 'es', 'fr', 'de', 'pt'].includes(newLanguage)) {
      setLanguage(newLanguage);
      localStorage.setItem('language', newLanguage);
    }
  };

  const value = {
    language,
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};