export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const r = await fetch('https://pickleballtournaments.com/tournaments-sitemap.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!r.ok) throw new Error('sitemap fetch failed: ' + r.status);
    const xml = await r.text();
    const urls = [...xml.matchAll(/<loc>(https:\/\/pickleballtournaments\.com\/tournaments\/[^<]+)<\/loc>/g)]
      .map(m => m[1])
      .filter(u => u.split('/').length === 5);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ urls, total: urls.length });
  } catch (e) {
    res.status(500).json({ error: 'sitemap fetch failed' });
  }
}
