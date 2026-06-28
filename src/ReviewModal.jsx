import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { request } from './api.js';

const C = {
  bg: '#1B1E23', surface: '#242830', surfaceAlt: '#2A2F38', border: '#383E48',
  amber: '#FFC53D', text: '#ECE8DF', muted: '#9099A3', mutedDark: '#666D78',
  success: '#6FBF73', rust: '#FF7A45',
};

const CRITERIA_SHIPPER = [
  { key: 'rating_overall',       label: 'Общая оценка' },
  { key: 'rating_punctuality',   label: 'Пунктуальность' },
  { key: 'rating_cargo',         label: 'Сохранность груза' },
  { key: 'rating_communication', label: 'Связь и документы' },
];

const CRITERIA_CARRIER = [
  { key: 'rating_overall',       label: 'Общая оценка' },
  { key: 'rating_punctuality',   label: 'Готовность к погрузке' },
  { key: 'rating_cargo',         label: 'Точность описания груза' },
  { key: 'rating_communication', label: 'Своевременность оплаты' },
];

function StarRow({ value, onChange, readOnly }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={22}
          fill={(hovered || value) >= s ? C.amber : 'transparent'}
          color={(hovered || value) >= s ? C.amber : C.mutedDark}
          style={{ cursor: readOnly ? 'default' : 'pointer', transition: 'color .1s' }}
          onMouseEnter={() => !readOnly && setHovered(s)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onChange(s)}
        />
      ))}
    </div>
  );
}

export default function ReviewModal({ orderId, reviewerRole, onClose, onDone }) {
  const criteria = reviewerRole === 'shipper' ? CRITERIA_SHIPPER : CRITERIA_CARRIER;
  const [ratings, setRatings] = useState({ rating_overall: 0, rating_punctuality: 0, rating_cargo: 0, rating_communication: 0 });
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setRating = (key, val) => setRatings((r) => ({ ...r, [key]: val }));

  const submit = async () => {
    if (!ratings.rating_overall) return setError('Поставьте хотя бы общую оценку');
    setBusy(true);
    setError('');
    try {
      await request('/reviews', {
        method: 'POST',
        body: { order_id: orderId, ...ratings, comment: comment.trim() || undefined },
      });
      onDone?.();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: C.surface, border: '1px solid ' + C.border, borderRadius: 12,
        width: '100%', maxWidth: 420, padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Оставить отзыв</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {criteria.map(({ key, label }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: key === 'rating_overall' ? C.text : C.muted, fontWeight: key === 'rating_overall' ? 600 : 400 }}>
                {label}
              </span>
              <StarRow value={ratings[key]} onChange={(v) => setRating(key, v)} />
            </div>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Комментарий (необязательно)..."
          style={{
            background: C.surfaceAlt, border: '1px solid ' + C.border, color: C.text,
            borderRadius: 8, padding: '10px 12px', fontSize: 13, resize: 'none', outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        {error && <div style={{ fontSize: 12, color: C.rust }}>{error}</div>}

        {/* Chars */}
        <div style={{ fontSize: 11, color: C.mutedDark, marginTop: -12, textAlign: 'right' }}>{comment.length}/500</div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={busy || !ratings.rating_overall}
          style={{
            background: ratings.rating_overall ? C.amber : C.surfaceAlt,
            color: ratings.rating_overall ? '#1B1E23' : C.mutedDark,
            border: 'none', borderRadius: 8, padding: '11px 0',
            fontSize: 14, fontWeight: 700, cursor: ratings.rating_overall ? 'pointer' : 'not-allowed',
            transition: 'background .15s',
          }}
        >
          {busy ? 'Отправляем...' : 'Отправить отзыв'}
        </button>
      </div>
    </div>
  );
}
