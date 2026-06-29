import React, { useState } from 'react';
import { Truck, Package, Phone, ArrowRight, KeyRound } from 'lucide-react';
import { auth, tokenStore } from './api.js';

const C = {
  bg: '#1B1E23', surface: '#242830', surfaceAlt: '#2A2F38', border: '#383E48',
  amber: '#FFC53D', amberDim: 'rgba(255,197,61,0.14)',
  steel: '#6FA8DC', steelDim: 'rgba(111,168,220,0.14)',
  text: '#ECE8DF', muted: '#9099A3', mutedDark: '#666D78', rust: '#FF7A45',
};

const inp = {
  width: '100%', background: C.surfaceAlt, border: '1px solid ' + C.border,
  color: C.text, borderRadius: 8, padding: '12px 14px', fontSize: 15,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

export default function AuthScreen({ onAuth }) {
  const [step, setStep] = useState('phone');   // phone | code | register
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');         // 'shipper' | 'carrier'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const err = (msg) => { setError(msg); setBusy(false); };

  // Шаг 1: отправить код
  const sendCode = async () => {
    if (!phone.trim()) return err('Введите номер телефона');
    setBusy(true); setError('');
    try {
      await auth.sendCode(phone.trim());
      setStep('code');
    } catch (e) { err(e.message); }
    setBusy(false);
  };

  // Шаг 2: подтвердить код → либо сразу войти, либо регистрация
  const verifyCode = async () => {
    if (!code.trim()) return err('Введите код');
    setBusy(true); setError('');
    try {
      const res = await auth.verify(phone.trim(), code.trim());
      if (res.token) {
        // Существующий пользователь — сразу входим
        tokenStore.set(res.token);
        onAuth(res.user);
      } else {
        // Новый пользователь — переходим к выбору роли
        setStep('register');
      }
    } catch (e) { err(e.message); }
    setBusy(false);
  };

  // Шаг 3: зарегистрироваться с ролью
  const register = async () => {
    if (!name.trim()) return err('Введите имя');
    if (!role) return err('Выберите кто вы — грузовладелец или перевозчик');
    setBusy(true); setError('');
    try {
      const res = await auth.register(phone.trim(), code.trim(), name.trim(), role, company.trim() || undefined);
      tokenStore.set(res.token);
      onAuth(res.user);
    } catch (e) { err(e.message); }
    setBusy(false);
  };

  const onKey = (fn) => (e) => e.key === 'Enter' && fn();

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500;600&display=swap'); .fa{font-family:'Oswald',sans-serif} .fb{font-family:'Inter',sans-serif}"}</style>

      {/* Лого */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Truck size={28} color={C.amber} />
        <span className="fa" style={{ fontSize: 32, color: C.text, letterSpacing: '.04em' }}>ТРАССА</span>
      </div>
      <div style={{ fontSize: 13, color: C.mutedDark, marginBottom: 36 }}>биржа грузоперевозок Казахстана</div>

      <div className="fb" style={{ background: C.surface, border: '1px solid ' + C.border, borderRadius: 14, padding: 28, width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ШАГ 1: Телефон */}
        {step === 'phone' && (
          <>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>Войти или зарегистрироваться</div>
              <div style={{ fontSize: 12, color: C.mutedDark }}>Введите номер телефона</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...inp, flex: 1 }} type="tel" placeholder="+7 700 000 00 00"
                value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={onKey(sendCode)} autoFocus />
              <button onClick={sendCode} disabled={busy}
                style={{ background: C.amber, color: '#1B1E23', border: 'none', borderRadius: 8, padding: '0 16px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                {busy ? '...' : <ArrowRight size={18} />}
              </button>
            </div>
          </>
        )}

        {/* ШАГ 2: Код */}
        {step === 'code' && (
          <>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>Введите код</div>
              <div style={{ fontSize: 12, color: C.mutedDark }}>Код отправлен на {phone} через Telegram</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...inp, flex: 1, letterSpacing: '.2em', textAlign: 'center', fontSize: 22 }}
                type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                value={code} onChange={e => setCode(e.target.value.replace(/D/g, ''))} onKeyDown={onKey(verifyCode)} autoFocus />
              <button onClick={verifyCode} disabled={busy}
                style={{ background: C.amber, color: '#1B1E23', border: 'none', borderRadius: 8, padding: '0 16px', cursor: 'pointer', fontWeight: 700 }}>
                {busy ? '...' : <KeyRound size={18} />}
              </button>
            </div>
            <button onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: C.mutedDark, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
              ← Изменить номер
            </button>
          </>
        )}

        {/* ШАГ 3: Регистрация */}
        {step === 'register' && (
          <>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>Создание аккаунта</div>
              <div style={{ fontSize: 12, color: C.mutedDark }}>Расскажите о себе — это займёт 30 секунд</div>
            </div>

            {/* Выбор роли — главный шаг */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: C.mutedDark, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Кто вы?</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* Грузовладелец */}
                <button onClick={() => setRole('shipper')} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '16px 8px', borderRadius: 10, cursor: 'pointer',
                  border: '2px solid ' + (role === 'shipper' ? C.amber : C.border),
                  background: role === 'shipper' ? C.amberDim : C.surfaceAlt,
                  transition: 'all .15s',
                }}>
                  <Package size={26} color={role === 'shipper' ? C.amber : C.mutedDark} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: role === 'shipper' ? C.amber : C.text }}>Грузовладелец</div>
                    <div style={{ fontSize: 10, color: C.mutedDark, marginTop: 2 }}>Публикую грузы</div>
                  </div>
                </button>

                {/* Перевозчик */}
                <button onClick={() => setRole('carrier')} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '16px 8px', borderRadius: 10, cursor: 'pointer',
                  border: '2px solid ' + (role === 'carrier' ? C.steel : C.border),
                  background: role === 'carrier' ? C.steelDim : C.surfaceAlt,
                  transition: 'all .15s',
                }}>
                  <Truck size={26} color={role === 'carrier' ? C.steel : C.mutedDark} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: role === 'carrier' ? C.steel : C.text }}>Перевозчик</div>
                    <div style={{ fontSize: 10, color: C.mutedDark, marginTop: 2 }}>Беру грузы</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Имя */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: C.mutedDark }}>Имя / ФИО</label>
              <input style={inp} type="text" placeholder="Иван Иванов"
                value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>

            {/* Компания (необязательно) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: C.mutedDark }}>Компания <span style={{ color: C.mutedDark }}>(необязательно)</span></label>
              <input style={inp} type="text" placeholder="ТОО Логистик"
                value={company} onChange={e => setCompany(e.target.value)} />
            </div>

            <button onClick={register} disabled={busy || !role || !name.trim()}
              style={{
                background: (role && name.trim()) ? C.amber : C.surfaceAlt,
                color: (role && name.trim()) ? '#1B1E23' : C.mutedDark,
                border: 'none', borderRadius: 8, padding: '13px 0',
                fontSize: 15, fontWeight: 700, cursor: (role && name.trim()) ? 'pointer' : 'not-allowed',
                transition: 'background .15s',
              }}>
              {busy ? 'Создаём аккаунт...' : 'Начать работу →'}
            </button>
          </>
        )}

        {/* Ошибка */}
        {error && (
          <div style={{ fontSize: 12, color: C.rust, background: 'rgba(255,122,69,0.1)', borderRadius: 6, padding: '8px 12px' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: C.mutedDark, textAlign: 'center' }}>
        Регистрируясь, вы соглашаетесь с условиями использования платформы
      </div>
    </div>
  );
            }
