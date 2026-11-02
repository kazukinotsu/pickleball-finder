export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { url: rawUrl } = req.query;
  if (!rawUrl || typeof rawUrl !== 'string') return res.status(400).json({ error: 'url required' });

  // SSRF対策: pickleballtournaments.com の /tournaments/<slug> のみ許可し、URLはサーバー側で再構築する
  let slug;
  try {
    const u = new URL(rawUrl);
    const m = u.pathname.match(/^\/tournaments\/([a-z0-9_-]{1,200})\/?$/i);
    if (u.protocol !== 'https:' || u.hostname !== 'pickleballtournaments.com' || u.port || u.username || u.password || !m) {
      return res.status(400).json({ error: 'invalid url' });
    }
    slug = m[1];
  } catch (_) {
    return res.status(400).json({ error: 'invalid url' });
  }
  const url = `https://pickleballtournaments.com/tournaments/${slug}`;

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1' },
      redirect: 'error',
      signal: AbortSignal.timeout(6000)
    });
    if (!r.ok) return res.status(200).json(null);
    const text = await r.text();

    const lat = parseFloat(text.match(/"Latitude":"([\d.-]+)"/)?.[1] || '0');
    const lon = parseFloat(text.match(/"Longitude":"([\d.-]+)"/)?.[1] || '0');
    if (!lat || !lon || Math.abs(lat) < 0.1) return res.status(200).json(null);

    const endDate = text.match(/"endDate":"(\d{4}-\d{2}-\d{2})"/)?.[1] || null;
    if (endDate && new Date(endDate) < new Date()) return res.status(200).json({ _past: true });

    const startDate = text.match(/"startDate":"(\d{4}-\d{2}-\d{2})"/)?.[1] || null;
    const nameMatch = text.match(/property="og:title" content="([^"]+)"/) || text.match(/content="([^"]+)" property="og:title"/);
    const name = (nameMatch?.[1] || slug).replace(' | PickleballTournaments.com', '').trim();
    const cost = text.match(/"currentRegPrice":"([^"]+)"/)?.[1] || '';
    const venueName = text.match(/"venueName":"([^"]+)"/)?.[1] || '';
    const cityStateZip = text.match(/"cityStateZip":"([^"]+)"/)?.[1] || '';
    const street = text.match(/"street":"([^"]+)"/)?.[1] || '';
    const hasGoldenTicket = text.includes('Golden Ticket') || text.includes('"isGoldenTicket":true');
    const prizeInfo = text.match(/"prizeInfo":"([^"]{2,200})"/)?.[1] || '';
    const hasPrizeMoney = prizeInfo.length > 0;
    const eventNames = [...new Set([...text.matchAll(/"eventName":"([^"]+)"/g)].map(m => m[1]))].slice(0, 8);
    const playerCount = parseInt(text.match(/"totalPlayers":(\d+)/)?.[1] || '0');

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      name, url, slug,
      lat, lon, startDate, endDate,
      cost, venueName, cityStateZip, street,
      hasGoldenTicket, prizeInfo, hasPrizeMoney,
      eventNames, playerCount,
    });
  } catch (e) {
    res.status(200).json(null);
  }
}
