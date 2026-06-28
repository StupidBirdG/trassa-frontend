import React, { useState, useEffect } from 'react';
import AuthScreen from './AuthScreen.jsx';
import App from './App.jsx';
import { auth, tokenStore } from './api.js';

export default function AppRoot() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setChecking(false); return; }
    auth.me().then(u => { setUser(u); setChecking(false); }).catch(() => { tokenStore.clear(); setChecking(false); });
  }, []);

  if (checking) return React.createElement('div', { style: { background: '#1B1E23', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFC53D', fontFamily: 'Inter, sans-serif', fontSize: 13 } }, 'Загрузка...');
  if (!user) return React.createElement(AuthScreen, { onAuth: (u) => setUser(u) });
  return React.createElement(App, { user: user, onLogout: () => { tokenStore.clear(); setUser(null); } });
}
