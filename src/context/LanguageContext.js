import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en, ur } from '../data/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  
  const translations = { en, ur };

  // Load saved language from storage
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('userLanguage');
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    
    loadLanguage();
  }, []);

  // Save language to storage whenever it changes
  useEffect(() => {
    const saveLanguage = async () => {
      try {
        await AsyncStorage.setItem('userLanguage', language);
      } catch (error) {
        console.error('Error saving language:', error);
      }
    };
    
    saveLanguage();
  }, [language]);

  const t = (key, params = {}) => {
    let translation = translations[language][key] || key;
    
    // Simple parameter replacement if needed
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, params[paramKey]);
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};