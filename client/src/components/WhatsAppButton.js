import React from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_CONFIG, openWhatsApp } from '../config/whatsapp';
import { useTranslation } from '../hooks/useTranslation';

const WhatsAppButton = ({ 
  phoneNumber = WHATSAPP_CONFIG.phoneNumber, 
  message,
  messageKey = "whatsapp.generalMessage", // Translation key for the message
  className = "",
  variant = "floating" // "floating" | "inline"
}) => {
  const { t } = useTranslation();
  
  const handleWhatsAppClick = () => {
    try {
      // Use provided message or translate from key
      const finalMessage = message || t(messageKey);
      openWhatsApp(phoneNumber, finalMessage);
    } catch (error) {
      console.error('WhatsApp open failed:', error);
      // Fallback: show contact information
      const fallbackMessage = `WhatsApp may not be available. You can contact us directly at:\n\nPhone: ${phoneNumber}\nEmail: info@syntaxdropshipping.com\n\nMessage: ${message || t(messageKey)}`;
      alert(fallbackMessage);
    }
  };

  if (variant === "floating") {
    return (
      <button
        onClick={handleWhatsAppClick}
        className={`fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 group ${className}`}
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          {t('whatsapp.tooltip')}
          <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className={`inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl ${className}`}
    >
      <MessageCircle className="w-5 h-5" />
      <span>{t('whatsapp.chatButton')}</span>
    </button>
  );
};

export default WhatsAppButton;