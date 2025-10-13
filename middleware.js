export default function middleware(req) {
  const ua = req.headers.get('user-agent')?.toLowerCase() || '';

  // LINEアプリ判定(例: Line/14.5.0)
  const isLineApp = /line\/\d+(\.\d+)?/i.test(ua);

  // LINEアプリ以外ならnotline.htmlを返す
  if (!isLineApp) {
    return new Response(
      fetch(new URL('/notline.html', req.url))
    );
  }

  // --- LINEアプリ内なら通常どおり進む ---
  return fetch(req);
}
