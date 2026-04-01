export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1' },
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
    const name = (nameMatch?.[1] || url.split('/tournaments/')[1]).replace(' | PickleballTournaments.com', '').trim();
    const cost = text.match(/"currentRegPrice":"([^"]+)"/)?.[1] || '';
    const venueName = text.match(/"venueName":"([^"]+)"/)?.[1] || '';
    const cityStateZip = text.match(/"cityStateZip":"([^"]+)"/)?.[1] || '';
    const street = text.match(/"street":"([^"]+)"/)?.[1] || '';
    const hasGoldenTicket = text.includes('Golden Ticket') || text.includes('"isGoldenTicket":true');
    const prizeInfo = text.match(/"prizeInfo":"([^"]{2,200})"/)?.[1] || '';
    const hasPrizeMoney = prizeInfo.length > 0;
    const eventNames = [...new Set([...text.matchAll(/"eventName":"([^"]+)"/g)].map(m => m[1]))].slice(0, 8);
    const playerCount = parseInt(text.match(/"totalPlayers":(\d+)/)?.[1] || '0');

    res.status(200).json({
      name, url, slug: url.split('/tournaments/')[1],
      lat, lon, startDate, endDate,
      cost, venueName, cityStateZip, street,
      hasGoldenTicket, prizeInfo, hasPrizeMoney,
      eventNames, playerCount,
    });
  } catch (e) {
    res.status(200).json(null);
  }
}
