import 'https://static.line-scdn.net/liff/edge/2/sdk.js';
// --- Firebase SDK読み込み ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDoc,
  doc,
  query,
  where,
  updateDoc
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



// 時間割に授業をセット
function setTimetable(timetableData){
  const table = document.getElementById('timetable');
  for (let k = 1; k <= 5; k++){
    for (let i = 1; i <= 12; i+=2){
      if (timetableData[(k-1)*6 + (i-1)/2 + 101] != '空きコマ'){
        table.rows[i].cells[k].innerText = timetableData[(k-1)*6 + (i-1)/2 + 101];
      }else{
        table.rows[i].cells[k].innerText = '/';
      }
    }
  }
}


// 時間割に欠時数をセット
function setAbsence(absenceData, timetableData){
  const table = document.getElementById('absence');
  for (let k = 1; k <= 5; k++){
    for (let i = 1; i <= 12; i+=2){
      if (timetableData[(k-1)*6 + (i-1)/2 + 101] == '空きコマ'){
        table.rows[i].cells[k].innerText = '/';
      }else{
        table.rows[i].cells[k].innerText = absenceData[timetableData[(k-1)*6 + (i-1)/2 + 101]];
      }
    }
  }
}


// 欠時数時間割に欠時増減ボタンを設置
function setButton(userId, timetableData, absenceData){
  const table = document.getElementById("absence");

  for (let k = 1; k <= 5; k++){
    for (let i = 1; i <= 12; i+=2){
      const className = timetableData[(k-1)*6 + (i-1)/2 + 101];

      if (className != '空きコマ'){
        const cell = table.rows[i].cells[k];

        // 現象ボタン設置
        const button1 = document.createElement("button");
        button1.textContent = "▽";
        button1.onclick = () => deleteAbsence(userId, className, absenceData, cell);
        cell.appendChild(button1);

        // 欠時数(spanで囲うことで、後でここだけ変更できる)
        const span = document.createElement("span");
        span.className = "count";
        span.textContent = absenceData[className];
        span.style.margin = "0 15px";
        cell.appendChild(span);

        // 増加ボタン設置
        const button2 = document.createElement("button");
        button2.textContent = "△";
        button2.onclick = () => addAbsence(userId, className, absenceData, cell);
        cell.appendChild(button2);
      }
    }
  }
}


// 欠時数を減らす
async function deleteAbsence(userId, className, absenceData, cell){
  if (absenceData[className] > 0){
    const docRef = doc(db, userId, 'absence');
  
    await updateDoc(docRef, {
      [className]: absenceData[className] - 1
    });

    // 反映
    const span = cell.querySelector(".count");
    span.textContent = absenceData[className] - 1;
  }
}

// 欠時数を増やす
async function addAbsence(userId, className, absenceData, cell){
  const docRef = doc(db, userId, 'absence');

  await updateDoc(docRef, {
    [className]: absenceData[className] + 1
  });

  // 反映
  const span = cell.querySelector(".count");
  span.textContent = absenceData[className] + 1;
}




// メインの処理
async function main(){
  // userId取得
  const userId = await firstLiff();

  // ユーザーの時間割情報と欠時数情報を取得
  const timetableData = await getData(userId, 'timetable');
  const absenceData = await getData(userId, 'absence');

  // 時間割に時間割と欠時数を表示
  setTimetable(timetableData);
  setAbsence(absenceData, timetableData);

  // 欠時数時間割に欠時変更ボタンを設置
  setButton(userId, timetableData, absenceData);
}


main();