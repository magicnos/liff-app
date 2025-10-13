export default function middleware(req, res, next) {
  // User-Agentを取得
  const ua = req.headers['user-agent']?.toLowerCase() || '';

  // LINEアプリの判定（例: "Line/14.5.1" のようなUAにマッチ）
  const isLineApp = /line\/\d+(\.\d+)?/i.test(ua);

  if (!isLineApp) {
    // LINEアプリ以外からのアクセスをブロック
    // ここで「外部ブラウザで開いたときにURLを見せない」ために
    // メッセージを表示するか、別のページへリダイレクト
    return new Response(
      `
      <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>LINE専用ページ</title>
          <style>
            body {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: "Noto Sans JP", sans-serif;
              background-color: #f8f9fa;
              color: #333;
              text-align: center;
            }
            .card {
              background: white;
              padding: 2rem;
              border-radius: 12px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>このページはLINEアプリ内で開いてください</h2>
            <p>LINEアプリのトーク画面からもう一度開き直してください。</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 403,
        headers: { 'content-type': 'text/html; charset=UTF-8' },
      }
    );
  }

  // LINEアプリからのアクセスなら次の処理へ
  return next();
}