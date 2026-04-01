// pages/api/search.js
// 戦略: サイトマップ全件取得 → ランダムサンプリングで並列バッチ取得 → 距離フィルター

export const config = { maxDuration: 60 }; // Vercel Pro: 60s, Free: 10s

async function zipToLatLon(zip) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?postalcode=${zip}&countrycodes=us&format=json&limit=1`,
    { headers: { 'User-Agent': 'pickleball-tourney-finder/1.0' } }
  );
  const data = await r.json();
  if (!data.length) throw new Error(`郵便番号 ${zip} が見つかりませんでした`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchSitemapUrls() {
  const r = await fetch('https://pickleballtournaments.com/tournaments-sitemap.xml', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const xml = await r.text();
  return [...xml.matchAll(/<loc>(https:\/\/pickleballtournaments\.com\/tournaments\/[^<]+)<\/loc>/g)]
    .map(m => m[1])
    .filter(u => u.split('/').length === 5);
}

async function fetchTournament(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1' },
      signal: AbortSignal.timeout(7000)
    });
    if (!r.ok) return null;
    const text = await r.text();

    const lat = parseFloat(text.match(/"Latitude":"([\d.-]+)"/)?.[1] || '0');
    const lon = parseFloat(text.match(/"Longitude":"([\d.-]+)"/)?.[1] || '0');
    if (!lat || !lon || Math.abs(lat) < 0.1) return null;

    const startDate = text.match(/"startDate":"(\d{4}-\d{2}-\d{2})"/)?.[1] || null;
    const endDate = text.match(/"endDate":"(\d{4}-\d{2}-\d{2})"/)?.[1] || null;

    // 過去の大会は早期リターン（日付があれば確認）
    if (endDate && new Date(endDate) < new Date()) return { _past: true };

    const name = text.match(/(?:og:title" content="|<title>)([^"<]+)/)?.[1]?.trim() || url.split('/tournaments/')[1];
    const cost = text.match(/"currentRegPrice":"([^"]+)"/)?.[1] || '';
    const venueName = text.match(/"venueName":"([^"]+)"/)?.[1] || '';
    const cityStateZip = text.match(/"cityStateZip":"([^"]+)"/)?.[1] || '';
    const street = text.match(/"street":"([^"]+)"/)?.[1] || '';
    const hasGoldenTicket = text.includes('Golden Ticket') || text.includes('"isGoldenTicket":true');
    const prizeInfo = text.match(/"prizeInfo":"([^"]{2,200})"/)?.[1] || '';
    const hasPrizeMoney = prizeInfo.length > 0 || text.includes('"cashPrize"') || (text.toLowerCase().includes('prize money'));
    const eventNames = [...new Set([...text.matchAll(/"eventName":"([^"]+)"/g)].map(m => m[1]))].slice(0, 8);
    const playerCount = parseInt(text.match(/"totalPlayers":(\d+)/)?.[1] || '0');

    return {
      name, url, slug: url.split('/tournaments/')[1],
      lat, lon, startDate, endDate,
      cost, venueName, cityStateZip, street,
      hasGoldenTicket, prizeInfo, hasPrizeMoney,
      eventNames, playerCount,
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { zip, radius = '80', unit = 'km', startDate, endDate, format, skill } = req.query;
  if (!zip) return res.status(400).json({ error: 'zip（郵便番号）が必要です' });

  try {
    // 1. ZIP → lat/lon
    const { lat, lon } = await zipToLatLon(zip);
    const radiusKm = parseFloat(radius) * (unit === 'miles' ? 1.60934 : 1);
    const now = new Date();

    // 2. サイトマップURL取得
    const allUrls = await fetchSitemapUrls();

    // 3. 並列バッチ処理（BATCH_SIZE件ずつ、最大SCAN_LIMIT件スキャン）
    const BATCH_SIZE = 20;
    const SCAN_LIMIT = Math.min(allUrls.length, 500); // 最新500件（サイトマップは新しい順）
    const results = [];

    for (let i = 0; i < SCAN_LIMIT && results.length < 40; i += BATCH_SIZE) {
      const batch = allUrls.slice(i, i + BATCH_SIZE);
      const details = await Promise.all(batch.map(fetchTournament));

      for (const d of details) {
        if (!d || d._past) continue;

        const dist = distKm(lat, lon, d.lat, d.lon);
        if (dist > radiusKm) continue;

        // 日付フィルター
        if (d.endDate && new Date(d.endDate) < now) continue;
        if (startDate && d.startDate && new Date(d.startDate) < new Date(startDate)) continue;
        if (endDate && d.startDate && new Date(d.startDate) > new Date(endDate)) continue;

        // フォーマット・スキルフィルター
        if (format || skill) {
          const evStr = d.eventNames.join(' ').toLowerCase();
          if (format && !evStr.includes(format.toLowerCase())) continue;
          if (skill && !evStr.includes(skill)) continue;
        }

        results.push({
          ...d,
          distanceKm: Math.round(dist * 10) / 10,
          distanceMiles: Math.round(dist / 1.60934 * 10) / 10,
        });
      }
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({
      center: { lat, lon, zip },
      radiusKm,
      scanned: SCAN_LIMIT,
      total: results.length,
      tournaments: results,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
