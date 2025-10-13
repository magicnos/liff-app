export async function onRequest(context) {
  const ua = context.request.headers.get("user-agent") || "";

  // UAに"Line"または"LIFF"を含む場合のみ許可
  if (!ua.includes("Line") && !ua.includes("LIFF")) {
    return new Response("このページはLINEアプリ内でのみ利用できます。", {
      status: 403,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  // 通常通りページを返す
  return await context.next();
}
