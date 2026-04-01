import { useState } from 'react';
import Head from 'next/head';

const C = {
  bg: '#0f172a', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
  gold: '#f6d365', orange: '#fda085', muted: '#64748b', text: '#e2e8f0',
  green: '#4ade80', blue: '#60a5fa',
};
const inp = {
  width: '100%', padding: '10px 12px', background: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box',
};
const lbl = { display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: 500 };

function Badge({ color, children }) {
  const s = {
    gold:  { bg: 'rgba(246,211,101,0.15)', br: 'rgba(246,211,101,0.4)',  tx: '#f6d365' },
    green: { bg: 'rgba(74,222,128,0.12)',  br: 'rgba(74,222,128,0.3)',   tx: '#4ade80' },
    blue:  { bg: 'rgba(96,165,250,0.12)',  br: 'rgba(96,165,250,0.3)',   tx: '#60a5fa' },
    red:   { bg: 'rgba(248,113,113,0.12)', br: 'rgba(248,113,113,0.3)',  tx: '#f87171' },
    muted: { bg: 'rgba(255,255,255,0.05)', br: 'rgba(255,255,255,0.1)',  tx: '#94a3b8' },
  }[color] || { bg: 'rgba(255,255,255,0.05)', br: 'rgba(255,255,255,0.1)', tx: '#94a3b8' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: s.bg, border: `1px solid ${s.br}`, color: s.tx }}>{children}</span>
  );
}

function TournamentCard({ t, unit }) {
  const [open, setOpen] = useState(false);
  const dist = unit === 'miles' ? `${t.distanceMiles} mi` : `${t.distanceKm} km`;
  const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const costDisplay = t.cost?.replace(/\$\s*/g, '$').replace('$$', '$') || '要確認';
  const isUpcoming = t.startDate && new Date(t.startDate + 'T12:00:00') >= new Date();
  const isThisWeek = t.startDate && (new Date(t.startDate + 'T12:00:00') - new Date()) < 7 * 86400000 && isUpcoming;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      overflow: 'hidden', marginBottom: 10, transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(246,211,101,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>

      <div style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4, color: C.text, lineHeight: 1.3 }}>
              {t.name}
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
              📍 {t.venueName || t.cityStateZip}
              {t.cityStateZip && t.venueName && <span style={{ color: '#475569' }}> · {t.cityStateZip}</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {t.hasGoldenTicket && <Badge color="gold">🎟 Golden Ticket</Badge>}
              {t.hasPrizeMoney && <Badge color="green">💰 賞金あり</Badge>}
              {isThisWeek && <Badge color="red">🔥 今週開催</Badge>}
              {t.startDate && <Badge color={isUpcoming ? 'blue' : 'muted'}>📅 {fmtDate(t.startDate)}{t.endDate && t.endDate !== t.startDate ? ' 〜 ' + fmtDate(t.endDate) : ''}</Badge>}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: C.gold }}>{dist}</div>
            <div style={{ fontSize: 13, color: C.green, marginTop: 2 }}>{costDisplay}</div>
            {t.playerCount > 0 && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>👥 {t.playerCount}名</div>}
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{open ? '▲' : '▼'}</div>
          </div>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px', background: 'rgba(0,0,0,0.2)' }}>
          {t.street && <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>🏠 {t.street}{t.cityStateZip ? ', ' + t.cityStateZip : ''}</div>}
          {t.eventNames?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 5 }}>イベント種別:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {t.eventNames.map((e, i) => <Badge key={i} color="muted">{e}</Badge>)}
              </div>
            </div>
          )}
          {t.prizeInfo && <div style={{ fontSize: 13, color: C.green, marginBottom: 10 }}>💰 {t.prizeInfo}</div>}
          <a href={t.url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 8, fontSize: 13,
              background: `linear-gradient(135deg,${C.gold},${C.orange})`,
              color: '#1a1a2e', fontWeight: 'bold', textDecoration: 'none' }}>
            詳細・登録 →
          </a>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [zip, setZip] = useState('94022');
  const [radius, setRadius] = useState('80');
  const [unit, setUnit] = useState('km');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState('');
  const [skill, setSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const search = async () => {
    if (!zip.trim()) { setError('郵便番号を入力してください'); return; }
    setLoading(true); setError(''); setResults(null);
    try {
      const p = new URLSearchParams({ zip, radius, unit });
      if (startDate) p.append('startDate', startDate);
      if (endDate) p.append('endDate', endDate);
      if (format) p.append('format', format);
      if (skill) p.append('skill', skill);

      const r = await fetch(`/api/search?${p}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || '検索に失敗しました');
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Pickleball Tournament Finder 🏓</title>
        <meta name="description" content="郵便番号で近くのピックルボール大会を検索" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: C.bg, color: C.text,
        fontFamily: "'Trebuchet MS', sans-serif", padding: '24px 16px', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 44 }}>🏓</div>
          <h1 style={{ margin: '8px 0 6px', fontSize: 26, fontWeight: 'bold',
            background: `linear-gradient(90deg,${C.gold},${C.orange})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Pickleball Tournament Finder
          </h1>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
            郵便番号で近くのピックルボール大会を検索しよう
          </p>
        </div>

        {/* Form */}
        <div style={{ maxWidth: 680, margin: '0 auto 24px', background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>

          {/* ZIP + Radius + Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>郵便番号（ZIP）*</label>
              <input value={zip} onChange={e => setZip(e.target.value)}
                placeholder="例: 94022" style={inp}
                onKeyDown={e => e.key === 'Enter' && search()} />
            </div>
            <div>
              <label style={lbl}>半径</label>
              <input type="number" value={radius} onChange={e => setRadius(e.target.value)}
                min="1" max="500" style={inp} />
            </div>
            <div>
              <label style={lbl}>単位</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="km">km</option>
                <option value="miles">マイル</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>開始日（任意）</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>終了日（任意）</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inp} />
            </div>
          </div>

          {/* Format + Skill */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={lbl}>形式（任意）</label>
              <select value={format} onChange={e => setFormat(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">全て</option>
                <option value="singles">Singles（シングルス）</option>
                <option value="doubles">Doubles（ダブルス）</option>
                <option value="mixed">Mixed（ミックス）</option>
              </select>
            </div>
            <div>
              <label style={lbl}>スキルレベル（任意）</label>
              <select value={skill} onChange={e => setSkill(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">全て</option>
                {['2.5','3.0','3.5','4.0','4.5','5.0','Open'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={search} disabled={loading} style={{
            width: '100%', padding: 14,
            background: loading ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg,${C.gold},${C.orange})`,
            border: 'none', borderRadius: 10,
            color: loading ? C.muted : '#1a1a2e',
            fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}>
            {loading ? '⏳ 検索中... （最大30秒かかる場合があります）' : '🔍 大会を検索'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ maxWidth: 680, margin: '0 auto 16px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px',
            fontSize: 14, color: '#fca5a5' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: '14px 16px', marginBottom: 10, opacity: 0.5 }}>
                <div style={{ height: 16, width: '60%', background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: C.muted }}>
                📍 ZIP {results.center.zip} から {results.radiusKm}km 圏内 ·
                <span style={{ marginLeft: 4 }}>{results.scanned}件スキャン</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: C.gold }}>
                {results.total}件の大会
              </div>
            </div>

            {results.total === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
                <div style={{ fontSize: 16, marginBottom: 8 }}>条件に合う大会が見つかりませんでした</div>
                <div style={{ fontSize: 13 }}>半径を広げるか、フィルターを外してみてください</div>
              </div>
            ) : (
              results.tournaments.map((t, i) => (
                <TournamentCard key={i} t={t} unit={unit} />
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ maxWidth: 680, margin: '40px auto 0', textAlign: 'center', color: '#334155', fontSize: 12 }}>
          データ出典: pickleballtournaments.com
        </div>
      </div>
    </>
  );
}
