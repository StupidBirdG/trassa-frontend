import React, { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { request } from './api.js';

const C = {
  surface: '#242830', surfaceAlt: '#2A2F38', border: '#383E48',
  amber: '#FFC53D', text: '#ECE8DF', muted: '#9099A3', mutedDark: '#666D78',
};

function Stars({ value, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size}
          fill={value >= s - 0.5 ? C.amber : 'transparent'}
          color={value >= s - 0.5 ? C.amber : C.mutedDark} />
      ))}
    </span>
  );
}

function MiniBar({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: C.muted, minWidth: 140 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: C.surfaceAlt, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: (value / 5 * 100) + '%', height: '100%', background: C.amber, borderRadius: 2, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 11, color: C.amber, minWidth: 24, textAlign: 'right' }}>
        {value ? value.toFixed(1) : '-'}
      </span>
    </div>
  );
}

export function RatingBadge({ userId }) {
  const [rating, setRating] = useState(null);
  useEffect(() => {
    if (!userId) return;
    request('/reviews/user/' + userId).then((d) => setRating(d.rating)).catch(() => {});
  }, [userId]);
  if (!rating || rating.total_reviews < 1) return <span style={{ fontSize: 11, color: C.mutedDark }}>Нет отзывов</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Stars value={parseFloat(rating.avg_overall)} size={13} />
      <span style={{ fontSize: 12, fontWeight: 700, color: C.amber }}>{parseFloat(rating.avg_overall).toFixed(1)}</span>
      <span style={{ fontSize: 11, color: C.mutedDark }}>({rating.total_reviews})</span>
    </span>
  );
}

export default function UserRating({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    request('/reviews/user/' + userId + '?page=1&limit=5')
      .then((d) => { setData(d.rating); setReviews(d.reviews); setTotal(d.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const loadMore = async () => {
    const next = page + 1;
    const d = await request('/reviews/user/' + userId + '?page=' + next + '&limit=5');
    setReviews((r) => [...r, ...d.reviews]);
    setPage(next);
  };

  if (loading) return <div style={{ fontSize: 12, color: C.mutedDark }}>Загрузка...</div>;
  if (!data || data.total_reviews < 1) return <div style={{ fontSize: 12, color: C.mutedDark }}>Отзывов пока нет</div>;

  const avg = parseFloat(data.avg_overall);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: C.amber, lineHeight: 1 }}>{avg.toFixed(1)}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stars value={avg} size={16} />
          <span style={{ fontSize: 11, color: C.mutedDark }}>{data.total_reviews} отзывов</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <MiniBar label="Пунктуальность" value={parseFloat(data.avg_punctuality)} />
        <MiniBar label="Сохранность / точность" value={parseFloat(data.avg_cargo)} />
        <MiniBar label="Связь и оплата" value={parseFloat(data.avg_communication)} />
      </div>
      <button onClick={() => setExpanded((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: C.muted, fontSize: 12, padding: 0 }}>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Скрыть отзывы' : 'Показать отзывы'}
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ background: C.surfaceAlt, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{r.reviewer_name}</span>
                <Stars value={r.rating_overall} size={13} />
              </div>
              {r.comment && <p style={{ margin: 0, fontSize: 12, color: C.muted, fontStyle: 'italic' }}>«{r.comment}»</p>}
              <span style={{ fontSize: 10, color: C.mutedDark }}>{new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          ))}
          {reviews.length < total && (
            <button onClick={loadMore}
              style={{ background: C.surfaceAlt, border: '1px solid ' + C.border, color: C.muted, borderRadius: 7, padding: '7px 0', fontSize: 12, cursor: 'pointer' }}>
              Ещё отзывы
            </button>
          )}
        </div>
      )}
    </div>
  );
}
