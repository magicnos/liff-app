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
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


let db, auth;


// DB初期化処理
async function initFirebaseAndLiff(){
  // Firebase初期化
  // (apiKey, authDomain, projectId)
  const firebaseConfig = {
    apiKey: "AIzaSyBdp66vY1UQJWQNpUaq_GBd-zcNnZXTXgg",
    authDomain: "linebot-799ed.firebaseapp.com",
    projectId: "linebot-799ed"
  };

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth();

  // 匿名ログイン
  await signInAnonymously(auth);
}


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
    document.getElementById("userId").textContent = profile.userId;

    return profile.userId;
  } catch (error){
    alert("エラーが起きました。再度開きなおすか、下記のエラー内容をお知らせください。\n" + "LIFF初期化に失敗しました: " + error);
  }
}


// Firestoreからデータ取得(コレクション/ドキュメント)
async function getData(path1, path2){
  const docRef = doc(db, path1, path2);
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


// 欠時数時間割にボタン設置
function setButton(userId, timetableData, absenceData){
  const table = document.getElementById("absence");

  for (let k = 1; k <= 5; k++){
    for (let i = 1; i <= 12; i += 2){
      const className = timetableData[(k-1)*6 + (i-1)/2 + 101];

      if (className && className != '空きコマ'){
        const cell = table.rows[i].cells[k];
        cell.textContent = ""; // クリア

        // 減ボタン
        const btnDown = document.createElement("button");
        btnDown.textContent = "▽";
        btnDown.onclick = () => changeAbsence(userId, className, absenceData, timetableData, btnDown, btnUp, -1);
        cell.appendChild(btnDown);

        // 欠時数(span)
        const span = document.createElement("span");
        span.className = "count";
        span.textContent = absenceData[className];
        cell.appendChild(span);

        // 増ボタン
        const btnUp = document.createElement("button");
        btnUp.textContent = "△";
        btnUp.onclick = () => changeAbsence(userId, className, absenceData, timetableData, btnDown, btnUp, 1);
        cell.appendChild(btnUp);
      }
    }
  }
}



// 欠時数を変える
async function changeAbsence(userId, className, absenceData, timetableData, btnDown, btnUp, operation){
  // 現在のローカル欠時数を取得
  const current = absenceData[className];
  // 欠時数増減倍率取得(name="absenceScale" のラジオボタンのうち、チェックされているものを取得)
  const scale = Number(document.querySelector('input[name="absenceScale"]:checked').value);
  // 0以下なら変更しない
  if (current - scale < 0 && operation == -1) return;
  // ローカルで新しい欠時数を定義
  const newValue = current + scale*operation;

  // ローカル欠時数変更
  absenceData[className] = newValue;
  // UI欠時数を変更
  const table = document.getElementById('absence');
  for (let k = 1; k <= 5; k++){
    for (let i = 1; i <= 12; i+=2){
      if (timetableData[(k-1)*6 + (i-1)/2 + 101] != '空きコマ'){
        const cell = table.rows[i].cells[k];
        const span = cell.querySelector(".count");
        span.textContent = absenceData[timetableData[(k-1)*6 + (i-1)/2 + 101]];
      }
    }
  }

  // ボタンを無効化
  btnDown.disabled = true;
  btnUp.disabled = true;

  // DBに触ってる
  const docRef = doc(db, userId, 'absence');

  try{
    // DB更新
    await updateDoc(docRef, { [className]: newValue });
  }catch (err){
    alert("更新に失敗しました。もう一度試してください。");

    // DB更新失敗時値を元に戻す
    absenceData[className] = current;
    span.textContent = current;
  }finally{
    // ボタン再有効化
    btnDown.disabled = false;
    btnUp.disabled = false;
  }
}

// モーダルの初期化
function initModal(userId){
  const modal = document.getElementById('modal');
  const span = document.getElementById('closeModal');

  // ×ボタンクリックで閉じる
  span.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // モーダル外クリックで閉じる
  window.addEventListener('click', (event) => {
    if (event.target == modal){
      modal.style.display = 'none';
    }
  });

  // モーダル内授業ボタン
  modal.addEventListener('click', e => {
    if (e.target.classList.contains('modal-btn')){
      const id = e.target.id;
      changeTimetable(userId, id);
      modal.style.display = 'none';
    }
  });
}

// セルをタップしたらモーダルを開く
function attachCellEvents(){
  // timetableテーブルだけ取得
  const timetable = document.getElementById('timetable');
  const cells = timetable.querySelectorAll('.cellText');

  cells.forEach(cell => {
    cell.addEventListener('click', async () => {
      const modal = document.getElementById("modal");
      const body = document.getElementById("modal-body");

      // タップされたセルの行・列番号を取得
      const row = cell.parentElement.rowIndex;
      const col = cell.cellIndex;

      // 時間割番号と授業群を取得
      const i = (Math.floor(row/2)) + (col-1)*6;
      const data = await getData('timetable_week', String(i+101));

      // モーダルに授業名を追加
      let html = `
        <h3>授業一覧</h3>
        <p>セル位置: 行 ${row}, 列 ${col}</p>
      `;
      for (let k = 0; k < Object.keys(data).length; k++){
        html += `<button id="m${i}-${k}" class="modal-btn">${data[k]}</button>`;
      }
      body.innerHTML = html;

      // モーダル表示
      modal.style.display = 'block';
    });
  });
}

// 時間割変更
function changeTimetable(userId, id){
  document.getElementById("username").textContent = `${userId} / ${id}`;
}





// メインの処理
async function main(){
  // DB初期化
  await initFirebaseAndLiff();
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

  // 時間割モーダル表示と内容セット
  initModal(userId);
  attachCellEvents();
}


main();