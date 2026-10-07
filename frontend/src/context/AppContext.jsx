import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export const translations = {
  kn: {
    appName: 'ಕೃಷಿಸೇತು ನೆಕ್ಸಸ್',
    tagline: 'ರೈತರ ಪ್ರಶ್ನೆಯಿಂದ ಖಚಿತ ಕೃಷಿ ಕ್ರಮದವರೆಗೆ',
    home: 'ಮುಖಪುಟ',
    consult: 'AI ಸಲಹೆ',
    store: 'ಅಂಗಡಿ',
    schemes: 'ಯೋಜನೆಗಳು',
    outbreakMap: 'ರೋಗ ನಕ್ಷೆ',
    profile: 'ಪ್ರೊಫೈಲ್',
    greeting: 'ನಮಸ್ಕಾರ, ರಮೇಶ್ ಗೌಡ',
    farmLocation: 'ಕೋಲಾರ ಜಿಲ್ಲೆ • 3.5 ಎಕರೆ',
    weatherAlert: 'ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ',
    sprayAdvisory: 'ಮುಂದಿನ 18 ಗಂಟೆಗಳಲ್ಲಿ ಮಳೆ ಸಾಧ್ಯತೆ - ಕೀಟನಾಶಕ ಸಿಂಪಡಣೆಯನ್ನು ಮುಂದೂಡಿ',
    askAiPrompt: 'ನಿಮ್ಮ ಬೆಳೆಯ ಸಮಸ್ಯೆಯನ್ನು ಧ್ವನಿ ಅಥವಾ ಪಠ್ಯದಲ್ಲಿ ತಿಳಿಸಿ...',
    diagnoseBtn: 'ರೋಗ ಪರೀಕ್ಷಿಸಿ',
    cart: 'ಬುಟ್ಟಿ',
    orderSuccess: 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿದೆ!',
    earlyBlightDetected: 'ಟೊಮೆಟೊ ಆರಂಭಿಕ ರೋಗ (Early Blight) ಪತ್ತೆಯಾಗಿದೆ',
    confidenceScore: '94% ನಿಖರತೆ',
    recommendedAction: 'ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ',
    applyScheme: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
    subsidiesAvailable: 'ಸಬ್ಸಿಡಿ ಲಭ್ಯವಿದೆ',
  },
  en: {
    appName: 'KrishiSetu Nexus',
    tagline: 'From farmer question to verified farm action',
    home: 'Home',
    consult: 'AI Consult',
    store: 'Store',
    schemes: 'Schemes',
    outbreakMap: 'Pest Map',
    profile: 'Profile',
    greeting: 'Namaskara, Ramesh Gowda',
    farmLocation: 'Kolar District • 3.5 Acres',
    weatherAlert: 'Weather Advisory',
    sprayAdvisory: 'Heavy rain expected in 18 hrs — Delay foliar spray!',
    askAiPrompt: 'Describe your crop issue by voice or text...',
    diagnoseBtn: 'Diagnose Crop',
    cart: 'Cart',
    orderSuccess: 'Order Placed Successfully!',
    earlyBlightDetected: 'Tomato Early Blight (Alternaria solani) Detected',
    confidenceScore: '94% Confidence',
    recommendedAction: 'Recommended Action',
    applyScheme: 'Apply Now',
    subsidiesAvailable: 'Subsidies Available',
  },
  hi: {
    appName: 'कृषिसितु नेक्सस',
    tagline: 'किसान के सवाल से लेकर सत्यापित खेत कार्रवाई तक',
    home: 'होम',
    consult: 'AI सलाह',
    store: 'दुकान',
    schemes: 'योजनाएं',
    outbreakMap: 'रोग मानचित्र',
    profile: 'प्रोफ़ाइल',
    greeting: 'नमस्ते, रमेश गौड़ा',
    farmLocation: 'कोलार जिला • 3.5 एकड़',
    weatherAlert: 'मौसम चेतावनी',
    sprayAdvisory: 'अगले 18 घंटों में बारिश की संभावना - छिड़काव टालें',
    askAiPrompt: 'अपनी फसल की समस्या बोलें या लिखें...',
    diagnoseBtn: 'फसल की जांच करें',
    cart: 'कार्ट',
    orderSuccess: 'ऑर्डर सफल रहा!',
    earlyBlightDetected: 'टमाटर अगेती झुलसा रोग पहचाना गया',
    confidenceScore: '94% सटीकता',
    recommendedAction: 'अनुशंसित उपचार',
    applyScheme: 'आवेदन करें',
    subsidiesAvailable: 'सब्सिडी उपलब्ध',
  },
  te: {
    appName: 'కృషిసేతు నెక్సస్',
    tagline: 'రైతు ప్రశ్న నుండి ధృవీకరించబడిన క్షేత్ర చర్య వరకు',
    home: 'హోమ్',
    consult: 'AI సలహా',
    store: 'దుకాణం',
    schemes: 'పథకాలు',
    outbreakMap: 'తెగుళ్ల మ్యాప్',
    profile: 'ప్రొఫైల్',
    greeting: 'నమస్కారం, రమేష్ గౌడ',
    farmLocation: 'కోలార్ జిల్లా • 3.5 ఎకరాలు',
    weatherAlert: 'వాతావరణ హెచ్చరిక',
    sprayAdvisory: 'వచ్చే 18 గంటల్లో వర్షం అవకాశం - స్ప్రే వాయిదా వేయండి',
    askAiPrompt: 'మీ పంట సమస్యను చెప్పండి లేదా వ్రాయండి...',
    diagnoseBtn: 'తెగులు నిర్ధారణ',
    cart: 'కార్ట్',
    orderSuccess: 'ఆర్డర్ విజయవంతమైంది!',
    earlyBlightDetected: 'టమోటా ముందస్తు తెగులు గుర్తించబడింది',
    confidenceScore: '94% ఖచ్చితత్వం',
    recommendedAction: 'సిఫార్సు చేయబడిన చర్య',
    applyScheme: 'దరఖాస్తు చేసుకోండి',
    subsidiesAvailable: 'రాయితీ లభ్యం',
  },
  ta: {
    appName: 'கிருஷிசேது நெக்ஸஸ்',
    tagline: 'விவசாயி கேள்வியிலிருந்து சரிபார்க்கப்பட்ட கள நடவடிக்கை வரை',
    home: 'முகப்பு',
    consult: 'AI ஆலோசனை',
    store: 'அங்காடி',
    schemes: 'திட்டங்கள்',
    outbreakMap: 'பூச்சி வரைபடம்',
    profile: 'சுயவிவரம்',
    greeting: 'வணக்கம், ரமேஷ் கவுடா',
    farmLocation: 'கோலார் மாவட்டம் • 3.5 ஏக்கர்',
    weatherAlert: 'வானிலை எச்சரிக்கை',
    sprayAdvisory: 'அடுத்த 18 மணி நேரத்தில் மழை வாய்ப்பு - தெளிப்பதை தள்ளிப்போடுங்கள்',
    askAiPrompt: 'உங்கள் பயிர் பிரச்சனையை குரல் அல்லது எழுத்தில் பகிருங்கள்...',
    diagnoseBtn: 'பயிர் பரிசோதனை',
    cart: 'கூடை',
    orderSuccess: 'ஆர்டர் வெற்றிகரமாக முடிந்தது!',
    earlyBlightDetected: 'தக்காளி ஆரம்பகால கருகல் நோய் கண்டறியப்பட்டது',
    confidenceScore: '94% துல்லியம்',
    recommendedAction: 'பரிந்துரைக்கப்பட்ட சிகிச்சை',
    applyScheme: 'விண்ணப்பிக்கவும்',
    subsidiesAvailable: 'மானியம் உள்ளது',
  }
};

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState('kn');
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [farmer] = useState({
    name: 'Ramesh Gowda',
    phone: '+91 98451 23456',
    village: 'Vokkaleri',
    district: 'Kolar',
    state: 'Karnataka',
    landHoldingAcres: 3.5,
    primaryCrop: 'Tomato (Sivam variety)',
    secondaryCrop: 'Finger Millet (Ragi)',
    soilType: 'Red sandy loam, pH 6.4',
  });

  const t = translations[lang] || translations.en;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`Added ${product.name} to Cart`);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        farmer,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        showToast,
        toastMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
