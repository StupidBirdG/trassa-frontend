import React, { useState } from 'react';
import { Truck, Package, MapPin, Calendar, Star, Plus, X, CheckCircle2, Filter, Phone } from 'lucide-react';

/* ---------------------------------- TOKENS ---------------------------------- */

const C = {
  bg: '#1B1E23',
  surface: '#242830',
  surfaceAlt: '#2A2F38',
  border: '#383E48',
  borderLight: '#454B56',
  amber: '#FFC53D',
  amberDim: 'rgba(255,197,61,0.14)',
  rust: '#FF7A45',
  rustDim: 'rgba(255,122,69,0.14)',
  steel: '#6FA8DC',
  steelDim: 'rgba(111,168,220,0.14)',
  text: '#ECE8DF',
  muted: '#9099A3',
  mutedDark: '#666D78',
  success: '#6FBF73',
  successDim: 'rgba(111,191,115,0.14)',
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
  if (DIST[`${from}-${to}`]) return DIST[`${from}-${to}`];
  if (DIST[`${to}-${from}`]) return DIST[`${to}-${from}`];
  let hash = 0;
  const s = `${from}-${to}`;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) % 1000;
  return 150 + (hash % 700);
}

const money = (n) => `${Number(n).toLocaleString('ru-RU')} ₸`;

let _id = 1000;
const nid = () => _id++;

/* ---------------------------------- SEED DATA ---------------------------------- */

function makeSeed() {
  const a = { id: nid(), from: 'Алматы', to: 'Шымкент', weight: 18, type: 'Стройматериалы', date: '2026-06-25', price: 420000, comment: 'Цемент в мешках, нужен тент.', owner: 'ТОО «Алатау Строй»', ownerPhone: '+7 701 234 56 78', status: 'open',
    bids: [
      { id: nid(), carrierName: 'Ерлан Т.', truckType: 'Тент 20т', price: 400000, rating: 4.8, phone: '+7 705 111 22 33' },
      { id: nid(), carrierName: 'ТОО «ТрансЛогист»', truckType: 'Тент 20т', price: 415000, rating: 4.6, phone: '+7 708 222 33 44' },
    ], acceptedBidId: null };

  const b = { id: nid(), from: 'Астана', to: 'Караганда', weight: 9, type: 'Продукты питания', date: '2026-06-22', price: 180000, comment: 'Скоропорт, нужен рефрижератор.', owner: 'ИП Сапаров', ownerPhone: '+7 707 345 67 89', status: 'open', bids: [], acceptedBidId: null };

  const c = { id: nid(), from: 'Шымкент', to: 'Тараз', weight: 5, type: 'Текстиль', date: '2026-06-21', price: 95000, comment: '', owner: 'Asem Textile', ownerPhone: '+7 705 456 78 90', status: 'in_transit',
    bids: [{ id: nid(), carrierName: 'Бауыржан К.', truckType: 'Тент 5т', price: 90000, rating: 4.9, phone: '+7 701 333 44 55' }], acceptedBidId: null };
  c.acceptedBidId = c.bids[0].id;

  const d = { id: nid(), from: 'Атырау', to: 'Актобе', weight: 22, type: 'Металлопрокат', date: '2026-06-18', price: 560000, comment: 'Трубы, длина 12 м.', owner: 'ТОО «КаспийМеталл»', ownerPhone: '+7 702 567 89 01', status: 'delivered',
    bids: [{ id: nid(), carrierName: 'Нурлан С.', truckType: 'Площадка', price: 540000, rating: 4.7, phone: '+7 707 444 55 66' }], acceptedBidId: null };
  d.acceptedBidId = d.bids[0].id;

  return [a, b, c, d];
}

/* ---------------------------------- SMALL PIECES ---------------------------------- */

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
        <div style={{ position: 'absolute', top: 6, left: 0, right: 0, borderTop: `2px ${isDelivered ? 'solid' : 'dashed'} ${lineColor}`, opacity: isDelivered ? 0.55 : 0.45 }} />
        <Truck size={15} className={isTransit ? 'truck-driving' : ''} style={{ position: 'absolute', top: -1, color: lineColor, left: truckLeft, transition: 'left .3s' }} />
      </div>
      <div className="font-mono" style={{ textAlign: 'center', fontSize: 10, color: C.mutedDark, marginTop: 3, letterSpacing: '.04em' }}>
        {distance === 0 ? 'в черте города' : `≈ ${distance} км`}
      </div>
    </div>
  );
}

function StatusBadge({ cargo }) {
  let label, color, bg;
  if (cargo.status === 'delivered') { label = 'Доставлено'; color = C.success; bg = C.successDim; }
  else if (cargo.status === 'in_transit') { label = 'В пути'; color = C.steel; bg = C.steelDim; }
  else if (cargo.bids.length > 0) { label = `${cargo.bids.length} предложения(й)`; color = C.amber; bg = C.amberDim; }
  else { label = 'Ищем перевозчика'; color = C.muted; bg = 'rgba(255,255,255,0.05)'; }
  return (
    <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, color, background: bg, border: `1px solid ${color}40`, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function MetaChip({ icon, children }) {
  return (
    <span className="font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: C.muted }}>
      {icon}{children}
    </span>
  );
}

/* ---------------------------------- CARGO CARD ---------------------------------- */

function CargoCard({ cargo, role, carrierName, carrierPhone, onAcceptBid, onMarkDelivered, onAddBid }) {
  const [bidding, setBidding] = useState(false);
  const [bidPrice, setBidPrice] = useState('');
  const [bidTruck, setBidTruck] = useState(TRUCK_TYPES[0]);
  const dist = getDistance(cargo.from, cargo.to);
  const acceptedBid = cargo.bids.find((b) => b.id === cargo.acceptedBidId);
  const myBid = cargo.bids.find((b) => b.carrierName === carrierName);
  const takenByOther = acceptedBid && acceptedBid.carrierName !== carrierName;

  const submitBid = () => {
    if (!bidPrice || Number(bidPrice) <= 0) return;
    onAddBid(cargo.id, { id: nid(), carrierName: carrierName || 'Вы', truckType: bidTruck, price: Number(bidPrice), phone: carrierPhone });
    setBidding(false);
    setBidPrice('');
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, color: C.mutedDark }}>{cargo.owner}</span>
          <span className="font-mono" style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={10} />{cargo.ownerPhone}
          </span>
        </div>
        <StatusBadge cargo={cargo} />
      </div>

      <RouteLine from={cargo.from} to={cargo.to} distance={dist} status={cargo.status} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', paddingTop: 2 }}>
        <MetaChip icon={<Package size={12} />}>{cargo.type}, {cargo.weight} т</MetaChip>
        <MetaChip icon={<Calendar size={12} />}>{cargo.date}</MetaChip>
        <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: C.amber }}>{money(cargo.price)}</span>
      </div>

      {cargo.comment && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>«{cargo.comment}»</div>}

      {/* ---- SHIPPER SIDE: bid list / accepted info ---- */}
      {role === 'shipper' && cargo.status === 'open' && cargo.bids.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          {cargo.bids.map((b) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.surfaceAlt, borderRadius: 7, padding: '7px 10px', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{b.carrierName}</span>
                <span style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  {b.truckType} <Star size={10} fill={C.amber} color={C.amber} style={{ marginLeft: 4 }} />{b.rating ?? '—'}
                  <span className="font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6 }}><Phone size={10} />{b.phone}</span>
                </span>
              </div>
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{money(b.price)}</span>
              <button onClick={() => onAcceptBid(cargo.id, b.id)} style={{ fontSize: 11, fontWeight: 700, color: '#1B1E23', background: C.amber, border: 'none', borderRadius: 5, padding: '6px 10px', cursor: 'pointer' }}>
                Принять
              </button>
            </div>
          ))}
        </div>
      )}

      {role === 'shipper' && cargo.status === 'in_transit' && acceptedBid && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: C.steel }}>
            Выбран: <strong>{acceptedBid.carrierName}</strong> · {acceptedBid.truckType} · {money(acceptedBid.price)}
            <span className="font-mono" style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3, color: C.muted }}><Phone size={10} />{acceptedBid.phone}</span>
          </span>
          <button onClick={() => onMarkDelivered(cargo.id)} style={{ fontSize: 11, fontWeight: 700, color: C.text, background: 'transparent', border: `1px solid ${C.success}`, borderRadius: 5, padding: '6px 10px', cursor: 'pointer' }}>
            Отметить доставленным
          </button>
        </div>
      )}

      {role === 'shipper' && cargo.status === 'delivered' && acceptedBid && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, fontSize: 12, color: C.success, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <CheckCircle2 size={14} /> Доставлено: {acceptedBid.carrierName} · {money(acceptedBid.price)}
          <span className="font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: C.mutedDark }}><Phone size={10} />{acceptedBid.phone}</span>
        </div>
      )}

      {role === 'shipper' && cargo.status === 'open' && cargo.bids.length === 0 && (
        <div style={{ fontSize: 12, color: C.mutedDark, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          Пока нет предложений — груз виден всем перевозчикам на линии.
        </div>
      )}

      {/* ---- CARRIER SIDE: bid action ---- */}
      {role === 'carrier' && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          {acceptedBid && !takenByOther && (
            <div style={{ fontSize: 12.5, color: C.success, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <CheckCircle2 size={14} /> Закреплено за вами · {money(acceptedBid.price)}
              <span className="font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: C.muted, marginLeft: 4 }}>
                <Phone size={10} /> звоните грузовладельцу: {cargo.ownerPhone}
              </span>
            </div>
          )}
          {takenByOther && (
            <div style={{ fontSize: 12, color: C.mutedDark }}>Занято другим перевозчиком.</div>
          )}
          {!acceptedBid && myBid && (
            <div style={{ fontSize: 12, color: C.amber }}>Ваше предложение {money(myBid.price)} ожидает решения грузовладельца.</div>
          )}
          {!acceptedBid && !myBid && !bidding && (
            <button onClick={() => setBidding(true)} style={{ fontSize: 12, fontWeight: 700, color: '#1B1E23', background: C.amber, border: 'none', borderRadius: 6, padding: '7px 12px', cursor: 'pointer' }}>
              Откликнуться на груз
            </button>
          )}
          {bidding && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <select value={bidTruck} onChange={(e) => setBidTruck(e.target.value)} style={selStyle}>
                {TRUCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" placeholder="Ваша цена, ₸" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} style={{ ...inputStyle, width: 130 }} />
              <button onClick={submitBid} style={{ fontSize: 11, fontWeight: 700, color: '#1B1E23', background: C.success, border: 'none', borderRadius: 5, padding: '7px 10px', cursor: 'pointer' }}>Отправить</button>
              <button onClick={() => setBidding(false)} style={{ fontSize: 11, color: C.muted, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 5, padding: '7px 10px', cursor: 'pointer' }}>Отмена</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- SHARED INPUT STYLES ---------------------------------- */

const inputStyle = { background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: '8px 10px', fontSize: 12.5, outline: 'none' };
const selStyle = { ...inputStyle };

/* ---------------------------------- NEW CARGO FORM ---------------------------------- */

function CargoForm({ onSubmit, onClose }) {
  const [from, setFrom] = useState(CITIES[0]);
  const [to, setTo] = useState(CITIES[1]);
  const [weight, setWeight] = useState('');
  const [type, setType] = useState(CARGO_TYPES[0]);
  const [date, setDate] = useState('2026-06-26');
  const [price, setPrice] = useState('');
  const [owner, setOwner] = useState('Ваша компания');
  const [ownerPhone, setOwnerPhone] = useState('+7 700 000 00 00');
  const [comment, setComment] = useState('');

  const valid = weight && price && from !== to && ownerPhone;

  const submit = () => {
    if (!valid) return;
    onSubmit({ id: nid(), from, to, weight: Number(weight), type, date, price: Number(price), comment, owner, ownerPhone, status: 'open', bids: [], acceptedBidId: null });
  };

  const field = (label, node) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: C.muted }}>
      {label}
      {node}
    </label>
  );

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.amber}66`, borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-display" style={{ fontSize: 15, letterSpacing: '.03em', color: C.text }}>НОВАЯ ЗАЯВКА НА ГРУЗ</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer' }}><X size={16} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
        {field('Откуда', <select value={from} onChange={(e) => setFrom(e.target.value)} style={selStyle}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>)}
        {field('Куда', <select value={to} onChange={(e) => setTo(e.target.value)} style={selStyle}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>)}
        {field('Вес, тонн', <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} placeholder="например 12" />)}
        {field('Тип груза', <select value={type} onChange={(e) => setType(e.target.value)} style={selStyle}>{CARGO_TYPES.map((c) => <option key={c}>{c}</option>)}</select>)}
        {field('Дата подачи', <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />)}
        {field('Цена, ₸', <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} placeholder="например 300000" />)}
        {field('Компания', <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} style={inputStyle} />)}
        {field('Телефон', <input type="text" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} style={inputStyle} placeholder="+7 7XX XXX XX XX" />)}
      </div>
      {field('Комментарий (необязательно)', <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} style={inputStyle} placeholder="особые условия перевозки" />)}

      {from === to && <div style={{ fontSize: 11, color: C.rust }}>Город отправления и назначения не должны совпадать.</div>}

      <button onClick={submit} disabled={!valid} style={{ alignSelf: 'flex-start', fontWeight: 700, fontSize: 12.5, color: valid ? '#1B1E23' : C.mutedDark, background: valid ? C.amber : C.surfaceAlt, border: `1px solid ${valid ? C.amber : C.border}`, borderRadius: 7, padding: '9px 16px', cursor: valid ? 'pointer' : 'not-allowed' }}>
        Опубликовать на бирже
      </button>
    </div>
  );
}

/* ---------------------------------- HEADER / STATS / ROLE SWITCH ---------------------------------- */

function Header() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Truck size={22} color={C.amber} />
          <span className="font-display" style={{ fontSize: 26, color: C.text, letterSpacing: '.04em' }}>ТРАССА</span>
        </div>
        <span style={{ fontSize: 12, color: C.mutedDark }}>биржа грузоперевозок · Казахстан</span>
      </div>
      <div style={{ height: 3, marginTop: 10, marginBottom: 18, background: `repeating-linear-gradient(90deg, ${C.amber} 0 18px, transparent 18px 30px)`, opacity: 0.6, borderRadius: 2 }} />
    </div>
  );
}

function StatsBar({ cargos }) {
  const active = cargos.filter((c) => c.status !== 'delivered').length;
  const transit = cargos.filter((c) => c.status === 'in_transit').length;
  const delivered = cargos.filter((c) => c.status === 'delivered').length;
  const Item = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 16px' }}>
      <span className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: C.amber }}>{String(value).padStart(2, '0')}</span>
      <span style={{ fontSize: 10.5, color: C.mutedDark, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
      <Item label="активных грузов" value={active} />
      <div style={{ width: 1, background: C.border }} />
      <Item label="в пути сейчас" value={transit} />
      <div style={{ width: 1, background: C.border }} />
      <Item label="доставлено" value={delivered} />
      <div style={{ width: 1, background: C.border }} />
      <Item label="перевозчиков на линии" value={47} />
    </div>
  );
}

function RoleSwitch({ role, setRole }) {
  const Lane = ({ id, label, icon, color }) => {
    const active = role === id;
    return (
      <button onClick={() => setRole(id)} style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '13px 10px', cursor: 'pointer', border: 'none',
        background: active ? `${color}1A` : 'transparent',
        borderTop: `3px solid ${active ? color : 'transparent'}`,
        color: active ? color : C.mutedDark, fontWeight: 700, fontSize: 13, letterSpacing: '.02em',
        transition: 'all .15s',
      }}>
        {icon} {label}
      </button>
    );
  };
  return (
    <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
      <Lane id="shipper" label="Я ГРУЗОВЛАДЕЛЕЦ" icon={<Package size={15} />} color={C.amber} />
      <div style={{ width: 1, background: `repeating-linear-gradient(180deg, ${C.borderLight} 0 5px, transparent 5px 10px)` }} />
      <Lane id="carrier" label="Я ПЕРЕВОЗЧИК" icon={<Truck size={15} />} color={C.steel} />
    </div>
  );
}

/* ---------------------------------- MAIN APP ---------------------------------- */

export default function TrassaApp() {
  const [cargos, setCargos] = useState(makeSeed);
  const [role, setRole] = useState('shipper');
  const [showForm, setShowForm] = useState(false);
  const [carrierName, setCarrierName] = useState('Вы');
  const [carrierPhone, setCarrierPhone] = useState('+7 700 000 00 00');
  const [cityFilter, setCityFilter] = useState('Все города');

  const addCargo = (cargo) => { setCargos((p) => [cargo, ...p]); setShowForm(false); };
  const addBid = (cargoId, bid) => setCargos((p) => p.map((c) => c.id === cargoId ? { ...c, bids: [...c.bids, bid] } : c));
  const acceptBid = (cargoId, bidId) => setCargos((p) => p.map((c) => c.id === cargoId ? { ...c, status: 'in_transit', acceptedBidId: bidId } : c));
  const markDelivered = (cargoId) => setCargos((p) => p.map((c) => c.id === cargoId ? { ...c, status: 'delivered' } : c));

  const visibleCargos = role === 'carrier' && cityFilter !== 'Все города'
    ? cargos.filter((c) => c.from === cityFilter)
    : cargos;

  return (
    <div className="font-body" style={{
      background: C.bg, minHeight: '100vh',
      padding: '22px 22px calc(22px + env(safe-area-inset-bottom))',
      paddingTop: 'calc(22px + env(safe-area-inset-top))',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-display { font-family: 'Oswald', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes driveAlong { 0% { left: 8%; } 50% { left: 80%; } 100% { left: 8%; } }
        .truck-driving { animation: driveAlong 4s ease-in-out infinite; }
        select, input { font-family: 'Inter', sans-serif; }
        select:focus, input:focus { border-color: ${C.amber} !important; }
        @media (max-width: 640px) { .cargo-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <Header />
      <StatsBar cargos={cargos} />
      <RoleSwitch role={role} setRole={setRole} />

      {role === 'shipper' && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span className="font-display" style={{ fontSize: 16, color: C.text, letterSpacing: '.02em' }}>ГРУЗЫ НА БИРЖЕ</span>
          {!showForm && (
            <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#1B1E23', background: C.amber, border: 'none', borderRadius: 7, padding: '9px 14px', cursor: 'pointer' }}>
              <Plus size={14} /> Опубликовать груз
            </button>
          )}
        </div>
      )}

      {role === 'shipper' && showForm && <div style={{ marginBottom: 18 }}><CargoForm onSubmit={addCargo} onClose={() => setShowForm(false)} /></div>}

      {role === 'carrier' && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span className="font-display" style={{ fontSize: 16, color: C.text, letterSpacing: '.02em' }}>ДОСТУПНЫЕ ГРУЗЫ</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.mutedDark }}>Ваше имя:</span>
            <input value={carrierName} onChange={(e) => setCarrierName(e.target.value)} style={{ ...inputStyle, width: 100 }} />
            <span style={{ fontSize: 11, color: C.mutedDark }}>Телефон:</span>
            <input value={carrierPhone} onChange={(e) => setCarrierPhone(e.target.value)} style={{ ...inputStyle, width: 140 }} />
            <Filter size={13} color={C.mutedDark} />
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={selStyle}>
              <option>Все города</option>
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {visibleCargos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.mutedDark, fontSize: 13 }}>
          Грузов по этому маршруту пока нет — попробуйте выбрать другой город или загляните позже.
        </div>
      ) : (
        <div className="cargo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
          {visibleCargos.map((cargo) => (
            <CargoCard key={cargo.id} cargo={cargo} role={role} carrierName={carrierName} carrierPhone={carrierPhone} onAcceptBid={acceptBid} onMarkDelivered={markDelivered} onAddBid={addBid} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 26, fontSize: 11, color: C.mutedDark, textAlign: 'center' }}>
        Демо-проект · данные хранятся только в текущей сессии
      </div>
    </div>
  );
}
