// WhatsApp Configuration
export const WHATSAPP_CONFIG = {
  // WhatsApp phone number (include country code)
  phoneNumber: "+8613570705010",
  
  // Default messages for different contexts
  messages: {
    general: "Hello! I'm interested in your dropshipping services.",
    hero: "Hi! I'm interested in your dropshipping services. Could you help me get started?",
    support: "Hi! I need help with your dropshipping platform.",
    pricing: "Hello! I'd like to know more about your pricing and services.",
    partnership: "Hi! I'm interested in becoming a partner. Can you provide more information?"
  },
  
  // Button configurations
  styles: {
    floating: {
      position: "bottom-6 right-6",
      size: "w-6 h-6",
      padding: "p-4"
    },
    inline: {
      padding: "px-6 py-3",
      size: "w-5 h-5"
    }
  }
};

// Utility function to generate WhatsApp URL
export const generateWhatsAppUrl = (phoneNumber, message) => {
  // Remove all non-digit characters including the + sign
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
};

// Utility function to open WhatsApp with multiple fallbacks
export const openWhatsApp = (phoneNumber, message) => {
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  const encodedMessage = encodeURIComponent(message);
  
  // Check if we're in China (common case for WhatsApp blocks)
  const isLikelyChina = navigator.language.includes('zh') || 
                       Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Shanghai') ||
                       Intl.DateTimeFormat().resolvedOptions().timeZone.includes('Beijing');
  
  // Try to detect if it's mobile or desktop
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Different strategies based on environment
  if (isLikelyChina) {
    // In China, try direct app protocol first, then show fallback
    if (isMobile) {
      // Try to open app directly
      window.location.href = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
      
      // Show fallback message after delay
      setTimeout(() => {
        showFallbackContact(phoneNumber, message);
      }, 2000);
    } else {
      // On desktop in China, show contact info directly
      showFallbackContact(phoneNumber, message);
    }
  } else {
    // Outside China, use normal methods
    const methods = [
      `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`,
      `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`,
      `https://wa.me/${cleanNumber}?text=${encodedMessage}`
    ];
    
    if (isMobile) {
      // Mobile: try app protocol first
      window.location.href = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
      setTimeout(() => {
        window.open(methods[0], '_blank', 'noopener,noreferrer');
      }, 1000);
    } else {
      // Desktop: try web version
      const newWindow = window.open(methods[0], '_blank', 'noopener,noreferrer');
      
      // If failed, try alternatives
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        setTimeout(() => window.open(methods[1], '_blank', 'noopener,noreferrer'), 500);
      }
    }
  }
};

// Fallback function to show contact information
const showFallbackContact = (phoneNumber, message) => {
  const contactInfo = `
🚫 WhatsApp may not be available in your region.

📞 Contact us directly:
Phone: ${phoneNumber}
Email: info@syntaxdropshipping.com

💬 Your message:
${message}

📋 You can copy this information and contact us through other channels.
  `.trim();
  
  // Try to copy to clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(`Phone: ${phoneNumber}\nEmail: info@syntaxdropshipping.com\nMessage: ${message}`);
    alert(contactInfo + '\n\n✅ Contact information copied to clipboard!');
  } else {
    alert(contactInfo);
  }
};