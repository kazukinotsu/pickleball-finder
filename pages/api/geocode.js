export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { zip } = req.query;
  if (!zip || typeof zip !== 'string' || !/^\d{5}$/.test(zip)) return res.status(400).json({ error: 'zip must be a 5-digit US ZIP code' });
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&countrycodes=us&format=json&limit=1`,
      { headers: { 'User-Agent': 'pickleball-tourney-finder/1.0' } }
    );
    if (!r.ok) throw new Error('Nominatim request failed');
    const data = await r.json();
    if (!data || !data.length) return res.status(404).json({ error: `ZIP ${zip} が見つかりません` });
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).json({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
  } catch (e) {
    res.status(500).json({ error: 'geocode failed' });
  }
}
