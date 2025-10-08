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
}


// 時間割に授業をセット
function setTimetable(timetableData){
  const table = document.getElementById('timetable');
  for (let k = 1; k <= 10; k+=2){
    for (let i = 1; i <= 12; i+=2){
      if (timetableData[((k-1)/2)*6 + (i-1)/2 + 101] != '空きコマ'){
        table.rows[i].cells[k].innerText = timetableData[((k-1)/2)*6 + (i-1)/2 + 101];
      }else{
        table.rows[i].cells[k].innerText = '/';
      }
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
  document.getElementById('test').textContent = 'テスト用';
  createTimetable();
  setTimetable(timetableData);
}


main();