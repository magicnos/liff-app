import 'https://static.line-scdn.net/liff/edge/2/sdk.js';
// --- Firebase SDK読み込み ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


// (apiKey, authDomain, projectId)
const firebaseConfig = {
  apiKey: "AIzaSyBdp66vY1UQJWQNpUaq_GBd-zcNnZXTXgg",
  authDomain: "linebot-799ed.firebaseapp.com",
  projectId: "linebot-799ed"
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


// 時間割レイアウト調整
function createTimetable(){
  // 時間割ヘッダーレイアウトを調整
  const header = document.getElementById("timetable");
  for (let i = 9; i >= 0; i-=2){
    const cell1 = header.rows[0].cells[i];
    cell1.setAttribute("colspan", 2);
    header.rows[0].deleteCell(i+1);
  }

  // 2時間連続セルを結合
  const cell = document.getElementById("timetable");
  for (let col = 10; col >= 1; col--){
    for (let row = 11; row >= 0; row-=2){
      const cell1 = cell.rows[row].cells[col];
      cell1.setAttribute("rowspan", 2);
      cell.rows[row + 1].deleteCell(col);
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


// Firestoreからデータ取得(userId/documentのみ)
async function getData(userId, path){
  const docRef = doc(db, userId, path);
  const snap = await getDoc(docRef);

  if (snap.exists()){
    return snap.data(); 
  }else{
    return null;
  }
}



// メインの処理
async function main(){
  const userId = await firstLiff();
  const timetableData = await getData(userId, 'timetable');
  document.getElementById('test').textContent = 'ここは成功';
  document.getElementById('timetable').rows[0].cells[1].innerText = "変更後の内容";
  createTimetable();
  setTimetable(timetableData);
}


main();