import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Package, Calendar, Star, Plus, X, CheckCircle2, Filter, Phone, Lock, Crown, MessageSquare } from 'lucide-react';
import { cargos as cargosApi, subscription as subApi, tokenStore } from './api.js';
import ReviewModal from './ReviewModal.jsx';
import { RatingBadge } from './UserRating.jsx';

const C = {
  bg: '#1B1E23', surface: '#242830', surfaceAlt: '#2A2F38', border: '#383E48', borderLight: '#454B56',
  amber: '#FFC53D', amberDim: 'rgba(255,197,61,0.14)', rust: '#FF7A45', rustDim: 'rgba(255,122,69,0.14)',
  steel: '#6FA8DC', steelDim: 'rgba(111,168,220,0.14)', text: '#ECE8DF', muted: '#9099A3', mutedDark: '#666D78',
  success: '#6FBF73', successDim: 'rgba(111,191,115,0.14)',
};

const CITIES = ['Алматы','Астана','Шымкент','Караганда','Актобе','Тараз','Павлодар','Атырау','Кызылорда','Костанай','Усть-Каменогорск','Туркестан'];
const CARGO_TYPES = ['Стройматериалы','Продукты питания','Бытовая техника','Металлопрокат','Текстиль','Сельхозтехника','Мебель','Промоборудование'];
const TRUCK_TYPES = ['Тент 20т','Тент 5т','Рефрижератор','Борт','Изотерм','Площадка'];

const DIST = {
  'Алматы-Шымкент':700,'Алматы-Астана':970,'Астана-Караганда':220,'Шымкент-Тараз':160,
  'Атырау-Актобе':400,'Алматы-Тараз':530,'Шымкент-Кызылорда':320,'Астана-Павлодар':430,
  'Алматы-Караганда':720,'Шымкент-Туркестан':120,'Алматы-Усть-Каменогорск':820,
  'Караганда-Костанай':650,'Астана-Костанай':480,'Шымкент-Астана':1170,
};
function getDistance(from, to) {
  if (from === to) return 0;
  if (DIST[from + '-' + to]) return DIST[from + '-' + to];
  if (DIST[to + '-' + from]) return DIST[to + '-' + from];
  let hash = 0; const s = from + '-' + to;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) % 1000;
  return 150 + (hash % 700);
}
const money = (n) => Number(n).toLocaleString('ru-RU') + ' ₸';
const inputStyle = { background: C.surfaceAlt, border: '1px solid ' + C.border, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 12.5, outline: 'none' };
const selStyle = { ...inputStyle };

function RouteLine({ from, to, distance, status }) {
  const isDelivered = status === 'delivered';
  const isTransit = status === 'in_transit';
  const lineColor = isDelivered ? C.success : C.amber;
  const truckLeft = isDelivered ? 'calc(100% - 13px)' : (isTransit ? undefined : '0%');
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{from}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{to}</span>
      </div>
      <div style={{ position: 'relative', height: 14 }}>
        <div style={{ position: 'absolute', top: 6, left: 0, right: 0, borderTop: '2px ' + (isDelivered ? 'solid' : 'dashed') + ' ' + lineColor, opacity: isDelivered ? 0.55 : 0.45 }} />
        <Truck size={15} className={isTransit ? 'truck-driving' : ''} style={{ position: 'absolute', top: -1, color: lineColor, left: truckLeft, transition: 'left .3s' }} />
      </div>
      <div className="font-mono" style={{ textAlign: 'center', fontSize: 10, color: C.mutedDark, marginTop: 3, letterSpacing: '.04em' }}>
        {distance === 0 ? 'в черте города' : '≈ ' + distance + ' км'}
      </div>
    </div>
  );
}

function StatusBadge({ cargo }) {
  let label, color, bg;
  const bidsCount = (cargo.bids || []).length;
  if (cargo.status === 'delivered') { label = 'Доставлено'; color = C.success; bg = C.successDim; }
  else if (cargo.status === 'in_transit') { label = 'В пути'; color = C.steel; bg = C.steelDim; }
  else if (bidsCount > 0) { label = bidsCount + ' предложения(й)'; color = C.amber; bg = C.amberDim; }
  else { label = 'Ищем перевозчика'; color = C.muted; bg = 'rgba(255,255,255,0.05)'; }
  return (
    <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, color, background: bg, border: '1px solid ' + color + '40', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function MetaChip({ icon, children }) {
  return <span className="font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: C.muted }}>{icon}{children}</span>;
}

function CargoCard({ cargo, role, onAcceptBid, onMarkDelivered, onBid, onNeedSub, onReview, myUserId }) {
  const [bidding, setBidding] = useState(false);
  const [bidPrice, setBidPrice] = useState('');
  const [bidTruck, setBidTruck] = useState(TRUCK_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const dist = getDistance(cargo.from_city, cargo.to_city);
  const bids = cargo.bids || [];
  const acceptedBid = bids.find((b) => b.id === cargo.accepted_bid_id);
  const myBid = bids.find((b) => b.carrier_id === myUserId);
  const takenByOther = acceptedBid && acceptedBid.carrier_id !== myUserId;
  const locked = cargo.contacts_locked;

  const submitBid = async () => {
    if (!bidPrice || Number(bidPrice) <= 0) return;
    setBusy(true);
    try { await onBid(cargo.id, { truck_type: bidTruck, price: Number(bidPrice) }); setBidding(false); setBidPrice(''); }
    catch (e) { if (e.code === 'subscription_required') onNeedSub(); else alert(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, color: C.mutedDark }}>{cargo.owner_company || cargo.owner_name || 'Грузовладелец'}</span>
          {locked ? (
            <span className="font-mono" style={{ fontSize: 11, color: C.mutedDark, display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={10} />оформите подписку</span>
          ) : (
            <span className="font-mono" style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} />{cargo.owner_phone || '—'}</span>
          )}
        </div>
        <StatusBadge cargo={cargo} />
      </div>
      <RouteLine from={cargo.from_city} to={cargo.to_city} distance={dist} status={cargo.status} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', paddingTop: 2 }}>
        <MetaChip icon={<Package size={12} />}>{cargo.cargo_type}, {cargo.weight_tons} т</MetaChip>
        <MetaChip icon={<Calendar size={12} />}>{cargo.pickup_date}</MetaChip>
        <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: C.amber }}>{money(cargo.price)}</span>
      </div>
      {cargo.comment && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>«{cargo.comment}»</div>}

      {role === 'shipper' && cargo.status === 'open' && bids.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid ' + C.border, paddingTop: 10 }}>
          {bids.map((b) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.surfaceAlt, borderRadius: 7, padding: '7px 10px', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{b.carrier_name}</span>
                <span style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  {b.truck_type} <RatingBadge userId={b.carrier_id} />
                  <span className="font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6 }}><Phone size={10} />{b.carrier_phone}</span>
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{money(b.price)}</span>
              <button onClick={() => onAcceptBid(cargo.id, b.id)} style={{ fontSize: 11, fontWeight: 700, color: '#1B1E23', background: C.amber, border: 'none', borderRadius: 5, padding: '6px 10px', cursor: 'pointer' }}>Принять</button>
            </div>
          ))}
        </div>
      )}

      {role === 'shipper' && cargo.status === 'in_transit' && acceptedBid && (
        <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: C.steel }}>Выбран: <strong>{acceptedBid.carrier_name}</strong> · {money(acceptedBid.price)}</span>
          <button onClick={() => onMarkDelivered(cargo.id)} style={{ fontSize: 11, fontWeight: 700, color: C.text, background: 'transparent', border: '1px solid ' + C.success, borderRadius: 5, padding: '6px 10px', cursor: 'pointer' }}>Отметить доставленным</button>
        </div>
      )}

      {role === 'shipper' && cargo.status === 'delivered' && acceptedBid && (
        <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 10, fontSize: 12, color: C.success, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> Доставлено: {acceptedBid.carrier_name} · {money(acceptedBid.price)}</div>
      )}

      {role === 'shipper' && cargo.status === 'open' && bids.length === 0 && (
        <div style={{ fontSize: 12, color: C.mutedDark, borderTop: '1px solid ' + C.border, paddingTop: 10 }}>Пока нет предложений — груз виден всем перевозчикам на линии.</div>
      )}

      {role === 'carrier' && (
        <div style={{ borderTop: '1px solid ' + C.border, paddingTop: 10 }}>
          {acceptedBid && !takenByOther && (
            <div style={{ fontSize: 12.5, color: C.success, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}><CheckCircle2 size={14} /> Закреплено за вами · {money(acceptedBid.price)}</div>
          )}
          {takenByOther && <div style={{ fontSize: 12, color: C.mutedDark }}>Занято другим перевозчиком.</div>}
          {!acceptedBid && myBid && <div style={{ fontSize: 12, color: C.amber }}>Ваше предложение {money(myBid.price)} ожидает решения грузовладельца.</div>}
          {!acceptedBid && !myBid && !bidding && (
            <button onClick={() => setBidding(true)} style={{ fontSize: 12, fontWeight: 700, color: '#1B1E23', background: C.amber, border: 'none', borderRadius: 6, padding: '7px 12px', cursor: 'pointer' }}>Откликнуться на груз</button>
          )}
          {bidding && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <select value={bidTruck} onChange={(e) => setBidTruck(e.target.value)} style={selStyle}>{TRUCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <input type="number" placeholder="Ваша цена, ₸" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} style={{ ...inputStyle, width: 130 }} />
              <button onClick={submitBid} disabled={busy} style={{ fontSize: 11, fontWeight: 700, color: '#1B1E23', background: C.success, border: 'none', borderRadius: 5, padding: '7px 10px', cursor: 'pointer' }}>{busy ? '...' : 'Отправить'}</button>
              <button onClick={() => setBidding(false)} style={{ fontSize: 11, color: C.muted, background: 'transparent', border: '1px solid ' + C.border, borderRadius: 5, padding: '7px 10px', cursor: 'pointer' }}>Отмена</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CargoForm({ onSubmit, onClose }) {
  const [from_city, setFrom] = useState(CITIES[0]);
  const [to_city, setTo] = useState(CITIES[1]);
  const [weight_tons, setWeight] = useState('');
  const [cargo_type, setType] = useState(CARGO_TYPES[0]);
  const [pickup_date, setDate] = useState('2026-06-30');
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = weight_tons && price && from_city !== to_city;
  const submit = async () => {
    if (!valid) return; setBusy(true);
    try { await onSubmit({ from_city, to_city, weight_tons: Number(weight_tons), cargo_type, pickup_date, price: Number(price), comment }); }
    catch (e) { alert(e.message); } finally { setBusy(false); }
  };
  const field = (label, node) => <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: C.muted }}>{label}{node}</label>;
  return (
    <div style={{ background: C.surface, border: '1px solid ' + C.amber + '66', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-display" style={{ fontSize: 15, letterSpacing: '.03em', color: C.text }}>НОВАЯ ЗАЯВКА НА ГРУЗ</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={16} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
        {field('Откуда', <select value={from_city} onChange={(e) => setFrom(e.target.value)} style={selStyle}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>)}
        {field('Куда', <select value={to_city} onChange={(e) => setTo(e.target.value)} style={selStyle}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>)}
        {field('Вес, тонн', <input type="number" value={weight_tons} onChange={(e) => setWeight(e.target.value)} style={inputStyle} placeholder="например 12" />)}
        {field('Тип груза', <select value={cargo_type} onChange={(e) => setType(e.target.value)} style={selStyle}>{CARGO_TYPES.map((c) => <option key={c}>{c}</option>)}</select>)}
        {field('Дата подачи', <input type="date" value={pickup_date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />)}
        {field('Цена, ₸', <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} placeholder="например 300000" />)}
      </div>
      {field('Комментарий (необязательно)', <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} style={inputStyle} placeholder="особые условия перевозки" />)}
      {from_city === to_city && <div style={{ fontSize: 11, color: C.rust }}>Город отправления и назначения не должны совпадать.</div>}
      <button onClick={submit} disabled={!valid || busy} style={{ alignSelf: 'flex-start', fontWeight: 700, fontSize: 12.5, color: valid ? '#1B1E23' : C.mutedDark, background: valid ? C.amber : C.surfaceAlt, border: '1px solid ' + (valid ? C.amber : C.border), borderRadius: 7, padding: '9px 16px', cursor: valid ? 'pointer' : 'not-allowed' }}>{busy ? '...' : 'Опубликовать на бирже'}</button>
    </div>
  );
}

function Header({ onLogout }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Truck size={22} color={C.amber} />
          <span className="font-display" style={{ fontSize: 26, color: C.text, letterSpacing: '.04em' }}>ТРАССА</span>
        </div>
        <button onClick={onLogout} style={{ fontSize: 11, color: C.mutedDark, background: 'transparent', border: '1px solid ' + C.border, borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>Выйти</button>
      </div>
      <div style={{ height: 3, marginTop: 10, marginBottom: 18, background: 'repeating-linear-gradient(90deg, ' + C.amber + ' 0 18px, transparent 18px 30px)', opacity: 0.6, borderRadius: 2 }} />
    </div>
  );
}

function SubscriptionBanner({ sub, onOpen }) {
  if (!sub || sub.role !== 'carrier') return null;
  const until = sub.subscription_until ? new Date(sub.subscription_until) : null;
  const daysLeft = until ? Math.ceil((until - new Date()) / 86400000) : 0;
  const active = sub.active;
  return (
    <div onClick={onOpen} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: active ? C.successDim : C.rustDim, border: '1px solid ' + (active ? C.success : C.rust) + '55', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
      <span style={{ fontSize: 12.5, color: active ? C.success : C.rust, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Crown size={15} />
        {active ? ('Подписка активна · осталось ' + daysLeft + ' дн.') : 'Подписка неактивна — оформите доступ'}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>Подробнее →</span>
    </div>
  );
}

function PricingScreen({ sub, onActivate, onBack, busy }) {
  const price = sub && sub.price ? sub.price : 9000;
  const until = sub && sub.subscription_until ? new Date(sub.subscription_until) : null;
  const daysLeft = until ? Math.ceil((until - new Date()) / 86400000) : 0;
  const active = sub && sub.active;
  const feats = ['Безлимитные отклики на грузы', 'Контакты грузовладельцев', 'Telegram-уведомления о заявках', 'Приоритет в выдаче'];
  return (
    <div style={{ maxWidth: 440, margin: '0 auto' }}>
      <button onClick={onBack} style={{ fontSize: 12, color: C.muted, background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 16 }}>← Назад к грузам</button>
      <div style={{ background: C.surface, border: '1px solid ' + C.amber + '66', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <Crown size={32} color={C.amber} />
          <div className="font-display" style={{ fontSize: 22, color: C.text, marginTop: 8 }}>ПОДПИСКА ПЕРЕВОЗЧИКА</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Полный доступ к бирже грузоперевозок</div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <span className="font-mono" style={{ fontSize: 34, fontWeight: 700, color: C.amber }}>{money(price)}</span>
          <span style={{ fontSize: 13, color: C.mutedDark }}> / месяц</span>
        </div>
        {active && (
          <div style={{ textAlign: 'center', fontSize: 12.5, color: C.success, background: C.successDim, borderRadius: 8, padding: '8px 12px' }}>Активна · осталось {daysLeft} дн.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {feats.map((f) => <div key={f} style={{ fontSize: 13, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={15} color={C.success} />{f}</div>)}
        </div>
        <button onClick={onActivate} disabled={busy} style={{ width: '100%', padding: 14, borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 15, cursor: busy ? 'not-allowed' : 'pointer', background: C.amber, color: '#1B1E23' }}>{busy ? '...' : (active ? 'Продлить на 30 дней' : 'Активировать подписку')}</button>
        <div style={{ fontSize: 11, color: C.mutedDark, textAlign: 'center', lineHeight: 1.5 }}>Оплата картой скоро будет доступна. Сейчас активация в тестовом режиме.</div>
      </div>
    </div>
  );
}

export default function TrassaApp({ user, onLogout }) {
  const [cargos, setCargos] = useState([]);
  const [sub, setSub] = useState(null);
  const [role, setRole] = useState(user && user.role ? user.role : 'shipper');
  const [showForm, setShowForm] = useState(false);
  const [cityFilter, setCityFilter] = useState('Все города');
  const [view, setView] = useState('board');
  const [loading, setLoading] = useState(true);
  const [subBusy, setSubBusy] = useState(false);
  const myUserId = user && user.id;

  const load = useCallback(async () => {
    try {
      const list = await cargosApi.list();
      setCargos(Array.isArray(list) ? list : []);
    } catch (e) { console.error(e); }
    if (role === 'carrier') { try { setSub(await subApi.status()); } catch (e) {} }
    setLoading(false);
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const addCargo = async (body) => { await cargosApi.create(body); setShowForm(false); await load(); };
  const onBid = async (cargoId, body) => { await cargosApi.bid(cargoId, body); await load(); };
  const acceptBid = async (cargoId, bidId) => { await cargosApi.accept(cargoId, bidId); await load(); };
  const markDelivered = async (cargoId) => { await cargosApi.deliver(cargoId); await load(); };
  const activate = async () => { setSubBusy(true); try { await subApi.activate(); setSub(await subApi.status()); await load(); } catch (e) { alert(e.message); } finally { setSubBusy(false); } };

  const visibleCargos = role === 'carrier' && cityFilter !== 'Все города' ? cargos.filter((c) => c.from_city === cityFilter) : cargos;

  return (
    <div className="font-body" style={{ background: C.bg, minHeight: '100vh', padding: '22px 22px calc(22px + env(safe-area-inset-bottom))', paddingTop: 'calc(22px + env(safe-area-inset-top))' }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap'); .font-display{font-family:'Oswald',sans-serif} .font-body{font-family:'Inter',sans-serif} .font-mono{font-family:'JetBrains Mono',monospace} @keyframes driveAlong{0%{left:8%}50%{left:80%}100%{left:8%}} .truck-driving{animation:driveAlong 4s ease-in-out infinite} select,input{font-family:'Inter',sans-serif} select:focus,input:focus{border-color:" + C.amber + " !important} @media(max-width:640px){.cargo-grid{grid-template-columns:1fr !important}}"}</style>

      <Header onLogout={onLogout} />

      {reviewModal && (
<ReviewModal orderId={reviewModal.orderId} reviewerRole={reviewModal.role} onClose={() => setReviewModal(null)} onDone={() => setReviewModal(null)} />
)}
{view === 'pricing' ? (
        <PricingScreen sub={sub} onActivate={activate} onBack={() => setView('board')} busy={subBusy} />
      ) : (
        <>
          <div style={{ display: 'flex', background: C.surface, border: '1px solid ' + C.border, borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
            <button onClick={() => setRole('shipper')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 10px', cursor: 'pointer', border: 'none', background: role === 'shipper' ? C.amber + '1A' : 'transparent', borderTop: '3px solid ' + (role === 'shipper' ? C.amber : 'transparent'), color: role === 'shipper' ? C.amber : C.mutedDark, fontWeight: 700, fontSize: 13 }}><Package size={15} /> Я ГРУЗОВЛАДЕЛЕЦ</button>
            <div style={{ width: 1, background: C.borderLight }} />
            <button onClick={() => setRole('carrier')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 10px', cursor: 'pointer', border: 'none', background: role === 'carrier' ? C.steel + '1A' : 'transparent', borderTop: '3px solid ' + (role === 'carrier' ? C.steel : 'transparent'), color: role === 'carrier' ? C.steel : C.mutedDark, fontWeight: 700, fontSize: 13 }}><Truck size={15} /> Я ПЕРЕВОЗЧИК</button>
          </div>

          {role === 'carrier' && <SubscriptionBanner sub={sub} onOpen={() => setView('pricing')} />}

          {role === 'shipper' && (
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span className="font-display" style={{ fontSize: 16, color: C.text, letterSpacing: '.02em' }}>ГРУЗЫ НА БИРЖЕ</span>
              {!showForm && <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#1B1E23', background: C.amber, border: 'none', borderRadius: 7, padding: '9px 14px', cursor: 'pointer' }}><Plus size={14} /> Опубликовать груз</button>}
            </div>
          )}
          {role === 'shipper' && showForm && <div style={{ marginBottom: 18 }}><CargoForm onSubmit={addCargo} onClose={() => setShowForm(false)} /></div>}

          {role === 'carrier' && (
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span className="font-display" style={{ fontSize: 16, color: C.text, letterSpacing: '.02em' }}>ДОСТУПНЫЕ ГРУЗЫ</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Filter size={13} color={C.mutedDark} />
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={selStyle}><option>Все города</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.mutedDark, fontSize: 13 }}>Загрузка...</div>
          ) : visibleCargos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.mutedDark, fontSize: 13 }}>Грузов пока нет — загляните позже или опубликуйте свой груз.</div>
          ) : (
            <div className="cargo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
              {visibleCargos.map((cargo) => (
                <CargoCard key={cargo.id} cargo={cargo} role={role} myUserId={myUserId} onAcceptBid={acceptBid} onMarkDelivered={markDelivered} onBid={onBid} onNeedSub={() => setView('pricing')} onReview={(orderId, reviewRole) => setReviewModal({ orderId, role: reviewRole })} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
        }
