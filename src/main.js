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
    document.getElementById("userid").textContent = profile.userId;

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
        btnDown.onclick = () => deleteAbsence(userId, className, absenceData, timetableData, btnDown, btnUp);
        cell.appendChild(btnDown);

        // 欠時数(span)
        const span = document.createElement("span");
        span.className = "count";
        span.textContent = absenceData[className];
        cell.appendChild(span);

        // 増ボタン
        const btnUp = document.createElement("button");
        btnUp.textContent = "△";
        btnUp.onclick = () => addAbsence(userId, className, absenceData, timetableData, btnDown, btnUp);
        cell.appendChild(btnUp);
      }
    }
  }
}



// 欠時を増やす
async function addAbsence(userId, className, absenceData, timetableData, btnDown, btnUp){
  // 現在のローカル欠時数を取得
  const current = absenceData[className];
  // 欠時数増減倍率取得
  const scale = absenceScale();
  // ローカルで新しい欠時数を定義
  const newValue = current + scale;

  // ローカル欠時数とUI更新
  absenceData[className] = newValue;
  changeAbsence(timetableData, absenceData);

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

// 欠時数を減らす
async function deleteAbsence(userId, className, absenceData, timetableData, btnDown, btnUp){
  // 現在のローカル欠時数を取得
  const current = absenceData[className];
  // 欠時数増減倍率取得
  const scale = absenceScale();
  // 0以下なら変更しない
  if (current - scale < 0) return;
  // ローカルで新しい欠時数を定義
  const newValue = current - scale;

  // ローカル欠時数とUIを即時更新
  absenceData[className] = newValue;
  changeAbsence(timetableData, absenceData);

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

// UI欠時数を変更する
function changeAbsence(timetableData, absenceData){
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
}

// 欠時数増減倍率数取得
function absenceScale(){
  // name="color" のラジオボタンのうち、チェックされているものを取得
  const selected = document.querySelector('input[name="absenceScale"]:checked');

  return Number(selected.value);
}


// モーダルの初期化
function initModal(){
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
}

// セルをタップしたらモーダルを開く
function attachCellEvents(){
  const cells = document.querySelectorAll('.cellText');
  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');

  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      modal.style.display = 'block';
      initModal(); // 再度閉じるボタンにイベントを設定
    });
  });
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
  initModal();
  attachCellEvents();
}


main();