import { useState, useRef, useCallback } from 'react';
import Head from 'next/head';

const C = {
  bg: '#0f172a', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
  gold: '#f6d365', orange: '#fda085', muted: '#64748b', text: '#e2e8f0',
  green: '#4ade80', blue: '#60a5fa', red: '#f87171',
};
const inp = {
  width: '100%', padding: '10px 12px', background: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box',
};
const lbl = { display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 6, fontWeight: 500 };

function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function Badge({ color, children }) {
  const s = {
    gold:  ['rgba(246,211,101,0.15)', 'rgba(246,211,101,0.4)',  '#f6d365'],
    green: ['rgba(74,222,128,0.12)',  'rgba(74,222,128,0.3)',   '#4ade80'],
    blue:  ['rgba(96,165,250,0.12)',  'rgba(96,165,250,0.3)',   '#60a5fa'],
    red:   ['rgba(248,113,113,0.12)', 'rgba(248,113,113,0.3)',  '#f87171'],
    muted: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)',  '#94a3b8'],
  }[color] || ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', '#94a3b8'];
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: s[0], border: `1px solid ${s[1]}`, color: s[2] }}>{children}</span>
  );
}

function TournamentCard({ t, unit }) {
  const [open, setOpen] = useState(false);
  const dist = unit === 'miles' ? `${t.distanceMiles} mi` : `${t.distanceKm} km`;
  const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const costDisplay = t.cost?.replace(/\$+\s*/g, '$') || '要確認';
  const daysUntil = t.startDate ? Math.ceil((new Date(t.startDate + 'T12:00:00') - new Date()) / 86400000) : null;
  const isThisWeek = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;
  const isUpcoming = daysUntil !== null && daysUntil >= 0;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      overflow: 'hidden', marginBottom: 10, transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(246,211,101,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
      <div style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4, color: C.text, lineHeight: 1.3 }}>{t.name}</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
              📍 {t.venueName || t.cityStateZip}
              {t.venueName && t.cityStateZip && <span style={{ color: '#475569' }}> · {t.cityStateZip}</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {t.hasGoldenTicket && <Badge color="gold">🎟 Golden Ticket</Badge>}
              {t.hasPrizeMoney && <Badge color="green">💰 賞金あり</Badge>}
              {isThisWeek && <Badge color="red">🔥 今週開催</Badge>}
              {t.startDate && (
                <Badge color={isUpcoming ? 'blue' : 'muted'}>
                  📅 {fmtDate(t.startDate)}{t.endDate && t.endDate !== t.startDate ? ' 〜 ' + fmtDate(t.endDate) : ''}
                </Badge>
              )}
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

// プログレスバー
function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round(current / total * 100) : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, marginBottom: 6 }}>
        <span>🔍 スキャン中... {current}/{total}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2,
          background: `linear-gradient(90deg,${C.gold},${C.orange})`, transition: 'width 0.3s' }} />
      </div>
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
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const abortRef = useRef(null);

  const search = useCallback(async () => {
    if (!zip.trim()) { setError('郵便番号を入力してください'); return; }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true); setError(''); setResults([]); setDone(false);
    setProgress({ current: 0, total: 0 });

    try {
      // Step 0: ZIP → lat/lon
      const geoRes = await fetch(`/api/geocode?zip=${zip}`, { signal: controller.signal });
      const geo = await geoRes.json();
      if (!geoRes.ok) throw new Error(geo.error);
      const { lat, lon } = geo;
      const radiusKm = parseFloat(radius) * (unit === 'miles' ? 1.60934 : 1);
      const now = new Date();

      // Step 1: サイトマップURL一覧取得
      const sitemapRes = await fetch('/api/sitemap', { signal: controller.signal });
      const sitemapData = await sitemapRes.json();
      if (!sitemapRes.ok) throw new Error(sitemapData.error);
      const urls = sitemapData.urls.slice(0, 600); // 最新600件
      setProgress({ current: 0, total: urls.length });

      // Step 2: フロントエンドから並列で大会詳細を取得
      const CONCURRENCY = 8; // 同時リクエスト数
      const found = [];
      let scanned = 0;

      for (let i = 0; i < urls.length && !controller.signal.aborted; i += CONCURRENCY) {
        const batch = urls.slice(i, i + CONCURRENCY);
        const reqs = batch.map(url =>
          fetch(`/api/tournament?url=${encodeURIComponent(url)}`, { signal: controller.signal })
            .then(r => r.json())
            .catch(() => null)
        );
        const details = await Promise.all(reqs);
        scanned += batch.length;
        setProgress({ current: scanned, total: urls.length });

        for (const d of details) {
          if (!d || d._past) continue;
          const dk = distKm(lat, lon, d.lat, d.lon);
          if (dk > radiusKm) continue;
          if (d.endDate && new Date(d.endDate) < now) continue;
          if (startDate && d.startDate && new Date(d.startDate) < new Date(startDate)) continue;
          if (endDate && d.startDate && new Date(d.startDate) > new Date(endDate)) continue;
          if (format || skill) {
            const ev = d.eventNames.join(' ').toLowerCase();
            if (format && !ev.includes(format.toLowerCase())) continue;
            if (skill && !ev.includes(skill)) continue;
          }
          const t = { ...d, distanceKm: Math.round(dk*10)/10, distanceMiles: Math.round(dk/1.60934*10)/10 };
          setResults(prev => [...prev, t].sort((a,b) => a.distanceKm - b.distanceKm));
        }

        // 十分な結果が出たら終了
        if (found.length >= 50) break;
      }

      setDone(true);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [zip, radius, unit, startDate, endDate, format, skill]);

  const stop = () => { if (abortRef.current) abortRef.current.abort(); setLoading(false); setDone(true); };

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
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>郵便番号で近くのピックルボール大会を検索しよう</p>
        </div>

        {/* Form */}
        <div style={{ maxWidth: 680, margin: '0 auto 24px', background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>郵便番号（ZIP）*</label>
              <input value={zip} onChange={e => setZip(e.target.value)}
                placeholder="例: 94022" style={inp}
                onKeyDown={e => e.key === 'Enter' && !loading && search()} />
            </div>
            <div>
              <label style={lbl}>半径</label>
              <input type="number" value={radius} onChange={e => setRadius(e.target.value)} min="1" max="500" style={inp} />
            </div>
            <div>
              <label style={lbl}>単位</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="km">km</option>
                <option value="miles">マイル</option>
              </select>
            </div>
          </div>
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
                {['2.5','3.0','3.5','4.0','4.5','5.0','Open'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={search} disabled={loading} style={{
              flex: 1, padding: 14,
              background: loading ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${C.gold},${C.orange})`,
              border: 'none', borderRadius: 10,
              color: loading ? C.muted : '#1a1a2e',
              fontSize: 16, fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? '🔍 検索中...' : '🔍 大会を検索'}
            </button>
            {loading && (
              <button onClick={stop} style={{
                padding: '14px 20px', background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10,
                color: C.red, fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
              }}>⏹ 停止</button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ maxWidth: 680, margin: '0 auto 16px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px',
            fontSize: 14, color: '#fca5a5' }}>⚠️ {error}</div>
        )}

        {/* Results area */}
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {/* Progress */}
          {loading && progress.total > 0 && (
            <ProgressBar current={progress.current} total={progress.total} />
          )}

          {/* Result count */}
          {(results.length > 0 || done) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: C.muted }}>
                📍 ZIP {zip} から {parseFloat(radius)}{unit} 圏内
                {done && <span style={{ marginLeft: 8, color: '#4ade80' }}>✓ 完了</span>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: C.gold }}>
                {results.length}件の大会{loading ? '（検索中）' : ''}
              </div>
            </div>
          )}

          {/* Cards */}
          {results.map((t, i) => <TournamentCard key={i} t={t} unit={unit} />)}

          {/* Empty state */}
          {done && results.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: 48, color: C.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>条件に合う大会が見つかりませんでした</div>
              <div style={{ fontSize: 13 }}>半径を広げるか、フィルターを外してみてください</div>
            </div>
          )}
        </div>

        <div style={{ maxWidth: 680, margin: '40px auto 0', textAlign: 'center', color: '#334155', fontSize: 12 }}>
          データ出典: pickleballtournaments.com
        </div>
      </div>
    </>
  );
}
