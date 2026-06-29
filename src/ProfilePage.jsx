import React, { useState, useEffect } from 'react';
import { User, Phone, Truck, Star, Edit2, Check, X, ChevronDown, ChevronUp, Hash } from 'lucide-react';
import { request } from './api.js';
import UserRating from './UserRating.jsx';

const C = {
  bg: '#1B1E23', surface: '#242830', surfaceAlt: '#2A2F38', border: '#383E48',
  amber: '#FFC53D', amberDim: 'rgba(255,197,61,0.14)', text: '#ECE8DF',
  muted: '#9099A3', mutedDark: '#666D78', success: '#6FBF73', rust: '#FF7A45',
};

const TRUCK_TYPES = ['Тент 20т','Тент 5т','Рефрижератор','Борт','Изотерм','Площадка'];

function Field({ label, icon, value, editing, onChange, type = 'text', options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: C.mutedDark, display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon} {label}
      </span>
      {editing ? (
        options ? (
          <select value={value || ''} onChange={e => onChange(e.target.value)}
            style={{ background: C.surfaceAlt, border: '1px solid ' + C.amber + '80', color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, outline: 'none' }}>
            <option value="">— не указано —</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
            style={{ background: C.surfaceAlt, border: '1px solid ' + C.amber + '80', color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 13, outline: 'none' }} />
        )
      ) : (
        <span style={{ fontSize: 14, color: value ? C.text : C.mutedDark, fontStyle: value ? 'normal' : 'italic' }}>
          {value || 'не указано'}
        </span>
      )}
    </div>
  );
}

export default function ProfilePage({ user, onClose, onUserUpdate }) {
  const [form, setForm] = useState({
    name: user.name || '',
    company_name: user.company_name || '',
    truck_type: user.truck_type || '',
    truck_number: user.truck_number || '',
  });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showReviews, setShowReviews] = useState(false);

  const isCarrier = user.role === 'carrier';

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const updated = await request('/auth/profile', { method: 'PUT', body: form });
      onUserUpdate?.(updated);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setForm({ name: user.name || '', company_name: user.company_name || '', truck_type: user.truck_type || '', truck_number: user.truck_number || '' });
    setEditing(false);
    setError('');
  };

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '24px 16px', overflowY: 'auto' }}>
      <div style={{ background: C.surface, border: '1px solid ' + C.border, borderRadius: 14, width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid ' + C.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.amberDim, border: '1px solid ' + C.amber + '40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color={C.amber} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{user.name}</div>
              <div style={{ fontSize: 11, color: C.mutedDark }}>{isCarrier ? 'Перевозчик' : 'Грузовладелец'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!editing && (
              <button onClick={() => setEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.amber, background: C.amberDim, border: '1px solid ' + C.amber + '40', borderRadius: 7, padding: '6px 10px', cursor: 'pointer' }}>
                <Edit2 size={12} /> Изменить
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Телефон — только чтение */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: C.mutedDark, display: 'flex', alignItems: 'center', gap: 5 }}><Phone size={11} /> Телефон</span>
            <span style={{ fontSize: 14, color: C.text, fontFamily: 'monospace' }}>{user.phone}</span>
          </div>

          <Field label="Имя / ФИО" icon={<User size={11} />} value={form.name} editing={editing} onChange={set('name')} />
          <Field label="Компания" icon={<Hash size={11} />} value={form.company_name} editing={editing} onChange={set('company_name')} />

          {/* Машина — только для перевозчиков */}
          {isCarrier && (
            <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.amber, display: 'flex', alignItems: 'center', gap: 6 }}><Truck size={13} /> Транспорт</span>
              <Field label="Тип кузова" icon={<Truck size={11} />} value={form.truck_type} editing={editing} onChange={set('truck_type')} options={TRUCK_TYPES} />
              <Field label="Гос. номер" icon={<Hash size={11} />} value={form.truck_number} editing={editing} onChange={set('truck_number')} />
            </div>
          )}

          {/* Ошибка */}
          {error && <div style={{ fontSize: 12, color: C.rust }}>{error}</div>}

          {/* Кнопки сохранения */}
          {editing && (
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button onClick={save} disabled={busy}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: C.amber, color: '#1B1E23', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                <Check size={14} /> {busy ? 'Сохраняем...' : 'Сохранить'}
              </button>
              <button onClick={cancel}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', color: C.muted, border: '1px solid ' + C.border, borderRadius: 8, padding: '10px 0', fontSize: 13, cursor: 'pointer' }}>
                <X size={14} /> Отмена
              </button>
            </div>
          )}
        </div>

        {/* Рейтинг и отзывы */}
        <div style={{ borderTop: '1px solid ' + C.border, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setShowReviews(v => !v)}
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={14} color={C.amber} fill={C.amber} /> Мой рейтинг и отзывы
            </span>
            {showReviews ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
          </button>
          {showReviews && <UserRating userId={user.id} />}
        </div>

      </div>
    </div>
  );
}
