// Step 0: ZIP → lat/lon
export default async function handler(req, res) {
  const { zip } = req.query;
  if (!zip) return res.status(400).json({ error: 'zip required' });
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&countrycodes=us&format=json&limit=1`,
      { headers: { 'User-Agent': 'pickleball-tourney-finder/1.0' } }
    );
    const data = await r.json();
    if (!data.length) return res.status(404).json({ error: `ZIP ${zip} が見つかりません` });
    res.status(200).json({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
