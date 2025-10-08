import 'https://static.line-scdn.net/liff/edge/2/sdk.js';
// --- Firebase SDK読み込み ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


// firebase(DB)の初期化
// (apiKey, authDomain, projectId)
const firebaseConfig = {
  apiKey: 'AIzaSyBdp66vY1UQJWQNpUaq_GBd-zcNnZXTXgg',
  authDomain: "linebot-799ed.firebaseapp.com",
  projectId: 'linebot-799ed'
};
// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



// liff初期化とプロフィール取得
async function firstLiff(){
  const liffId = "2008192386-zPDXa2d8";

  try{
    // LIFF初期化
    await liff.init({ liffId });

    // ログインしてなければログイン
    if (!liff.isLoggedIn()){
      liff.login();
      return;
    }

    // ユーザープロフィール取得
    const profile = await liff.getProfile();
    document.getElementById("username").textContent = profile.displayName;
    document.getElementById("userid").textContent = profile.userId;

    return profile.userId;
  } catch (error){
    alert("エラーが起きました。再度開きなおすか、下記のエラー内容をお知らせください。\n" + "LIFF初期化に失敗しました: " + error);
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

// 時間割ヘッダーレイアウトを調整
function headerTimetable(){
  const table = document.getElementById("timetable");
  for (let i = 9; i >= 0; i-=2){
    const cell1 = table.rows[0].cells[i];
    cell1.setAttribute("colspan", 2);
    table.rows[0].deleteCell(i+1);
  }
}

// 時間割内レイアウトを調整
function inTimetable(){
  // 2時間連続セルを結合
  const table = document.getElementById("timetable");
  for (let col = 10; col >= 1; col--){
    for (let row = 11; row >= 0; row-=2){
      const cell1 = table.rows[row].cells[col];
      const cell2 = table.rows[row + 1].cells[col];
      cell1.setAttribute("rowspan", 2);
      table.rows[row + 1].deleteCell(col);
    }
  }
}

// 時間割に授業をセット
function setTimetable(timetableData){
  for (let i = 0; i < 30; i++){
    if (timetableData[i] != '空きコマ'){
      document.getElementById(`c${(i*2) + 12*(Math.floor(i/6))}`).textContent = timetableData[i];
    }else{
      document.getElementById(`c${(i*2) + 12*(Math.floor(i/6))}`).textContent = '〇';
    }
  }
}




// Firestoreからデータ取得
async function getData(path){
  const ref  = await getDocs(collection(db, path.split("/")));

  const snapshot = await getDocs(ref);
  if (snapshot.exists()){
    return snapshot.data();
  }else{
    return null;
  }
}



const userId = firstLiff();
createTimetable();
headerTimetable();
inTimetable();
const timetableData = getData(`${userId}/timetable`);
setTimetable(timetableData);

