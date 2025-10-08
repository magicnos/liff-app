import 'https://static.line-scdn.net/liff/edge/2/sdk.js';

// liff初期化とプロフィール取得
async function main(){
  const liffId = "2008192386-zPDXa2d8";

  try {
    // ② LIFF初期化
    await liff.init({ liffId });
    console.log("LIFF init success");

    // ③ ログインしてなければログイン
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // ④ ユーザープロフィール取得
    const profile = await liff.getProfile();
    document.getElementById("username").textContent = profile.displayName;
    document.getElementById("userid").textContent = profile.userId;

    console.log("Logged in as:", profile.displayName);
  } catch (error) {
    console.error("LIFF initialization failed", error);
    alert("LIFF初期化に失敗しました: " + error);
  }
}


// 時間割枠組み作成
function createTimetable(){

  // 列（曜日）情報：2列ずつ（前後半）
  const days = ["月", "火", "水", "木", "金"];

  // 12限まで
  const periods = 12;

  // テーブル要素を取得
  const table = document.getElementById("timetable");

  // ---- ヘッダー行の作成 ----
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  // 「時限」列
  const thTime = document.createElement("th");
  thTime.textContent = "時限";
  headerRow.appendChild(thTime);

  // 各曜日（2列ずつ）
  for (const day of days) {
    for (let i = 0; i < 2; i++) {
      const th = document.createElement("th");
      th.textContent = day;
      headerRow.appendChild(th);
    }
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // ---- 本体（tbody）作成 ----
  const tbody = document.createElement("tbody");

  // 各限ごとの行
  for (let i = 0; i < periods; i++) {
    const tr = document.createElement("tr");

    // 時限列
    const tdPeriod = document.createElement("td");
    tdPeriod.textContent = `${i + 1}限`;
    tr.appendChild(tdPeriod);

    // 各曜日×2列ぶんのセル
    for (let j = 0; j < days.length * 2; j++) {
      const td = document.createElement("td");
      td.id = `c${i + j * periods}`; // 例：c0, c1, ..., c119
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
}


createTimetable();
main();
