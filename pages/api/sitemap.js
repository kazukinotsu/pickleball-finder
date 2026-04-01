export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const r = await fetch('https://pickleballtournaments.com/tournaments-sitemap.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!r.ok) throw new Error('sitemap fetch failed: ' + r.status);
    const xml = await r.text();
    const urls = [...xml.matchAll(/<loc>(https:\/\/pickleballtournaments\.com\/tournaments\/[^<]+)<\/loc>/g)]
      .map(m => m[1])
      .filter(u => u.split('/').length === 5);
    res.status(200).json({ urls, total: urls.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
