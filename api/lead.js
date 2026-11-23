const ALLOWED_LANGUAGES = new Set(['uz', 'ru', 'en']);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing one or more required environment variables.');
    return res.status(500).json({ success: false, error: 'Server is not configured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const course = typeof body?.course === 'string' ? body.course.trim() : '';
  const language = ALLOWED_LANGUAGES.has(body?.language) ? body.language : 'uz';

  if (!name || !phone || name.length > 100 || phone.length > 40 || course.length > 100) {
    return res.status(400).json({ success: false, error: 'Invalid form data' });
  }

  const labels = {
    uz: { title: '📝 Yangi ariza — SAZU Academy', name: 'Ism', phone: 'Telefon', course: 'Kurs' },
    ru: { title: '📝 Новая заявка — SAZU Academy', name: 'Имя', phone: 'Телефон', course: 'Курс' },
    en: { title: '📝 New request — SAZU Academy', name: 'Name', phone: 'Phone', course: 'Course' }
  }[language];

  const safe = (value) => value.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
  const telegramText = [
    `<b>${labels.title}</b>`,
    `${labels.name}: ${safe(name)}`,
    `${labels.phone}: ${safe(phone)}`,
    `${labels.course}: ${safe(course || '—')}`,
    `🕒 ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`
  ].join('\n');

  try {
    // Save the application in Supabase using the public anon key and the existing public INSERT RLS policy.
    const dbResponse = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ name, phone, course: course || null, status: 'new' })
    });
    if (!dbResponse.ok) {
      const detail = await dbResponse.text();
      console.error('Supabase insert failed:', dbResponse.status, detail);
      return res.status(502).json({ success: false, error: 'Could not save application' });
    }

    // Send the application to the configured Telegram group. The bot token stays on the server.
    const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: telegramText, parse_mode: 'HTML' })
    });
    const tgResult = await tgResponse.json().catch(() => ({}));
    if (!tgResponse.ok || !tgResult.ok) {
      console.error('Telegram send failed:', tgResult);
      return res.status(502).json({ success: false, error: 'Could not notify Telegram group' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Lead endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
