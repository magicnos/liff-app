import 'https://static.line-scdn.net/liff/edge/2/sdk.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  getDoc,
  doc,
  updateDoc,
  deleteField
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


let db, userId;

const changeMonth = 10;
const changeDay = 9;

// ユーザーの時間割
// ユーザーの前期欠時数
// ユーザーの後期欠時数
let timetableData = {}, absenceData = {}, absence2Data = {};


// Fires初期化
async function initFirebase(){
  const firebaseConfig = {
    apiKey: "AIzaSyBdp66vY1UQJWQNpUaq_GBd-zcNnZXTXgg",
    authDomain: "linebot-799ed.firebaseapp.com",
    projectId: "linebot-799ed",
  };

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  const auth = getAuth();

  // 匿名ログイン
  await signInAnonymously(auth);
}


// liff初期化
async function firstLiff(){
  const liffId = '2008192386-zPDXa2d8';
  try{
    // LIFF初期化
    await liff.init({ liffId });

    // ログイン状態チェック
    if (!liff.isLoggedIn()) {
      // ログインしていなければログインさせる
      liff.login(); // ログイン後、自動でリダイレクトして戻ってきます
      return; // この後の処理はログイン後に再度呼ぶ
    }


    // ユーザープロフィール取得
    const profile = await liff.getProfile();
    return profile.userId;
  }catch (error){
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


// 時間割tableに授業をセット
function setTimetable(){
  const table = document.getElementById('timetable');
  for (let k = 1; k <= 5; k++){
    for (let i = 1; i <= 12; i+=2){
      if (timetableData[(k-1)*6 + (i-1)/2 + 101] != '空きコマ'){
        table.rows[i].cells[k].innerText = timetableData[(k-1)*6 + (i-1)/2 + 101];
      }else{
        table.rows[i].cells[k].innerText = '-';
      }
    }
  }
}


// 欠時数時間割にボタン設置,総欠時変更
// (書きたい欠時数, もう片方の欠時数)
function setButton(absenceDoc, absence2Doc){
  const table = document.getElementById("absence");

  for (let k = 1; k <= 5; k++){
    for (let i = 1; i <= 12; i += 2){
      const className = timetableData[(k-1)*6 + (i-1)/2 + 101];

      // ここでクリアして、空きコマにした場所にボタンが残るのを防ぐ
      const cell = table.rows[i].cells[k];
      cell.textContent = ""; // クリア

      // 空きコマじゃないとき、ボタンと欠時数を設置
      if (className != '空きコマ'){
        // 要素を入れるコンテナ
        const wrapper = document.createElement("div");
        wrapper.className = "absence-wrapper";

        // 増ボタン
        const btnUp = document.createElement("button");
        btnUp.textContent = "△";
        btnUp.onclick = () => changeAbsence(className, absenceDoc, absence2Doc, 1);

        // 減ボタン
        const btnDown = document.createElement("button");
        btnDown.textContent = "▽";
        btnDown.onclick = () => changeAbsence(className, absenceDoc, absence2Doc, -1);

        // 欠時数(span)
        const span = document.createElement("span");
        span.className = "absence-count";
        span.textContent = absenceDoc[className];

        // ボタン2つをまとめる縦並びコンテナ
        const buttonGroup = document.createElement("div");
        buttonGroup.className = "button-group";
        buttonGroup.appendChild(btnUp);
        buttonGroup.appendChild(btnDown);

        // 最初のコンテナの中で、ボタンコンテナの右に欠時数を配置
        wrapper.appendChild(buttonGroup);
        wrapper.appendChild(span);

        // セルに入れる
        cell.appendChild(wrapper);
      }else{
        cell.textContent = "-";
      }
    }
  }

  // 総欠時数変更
  allAbsence();
}


// 欠時数テーブルを総合表示にする
function setAbsenceAll(){
  const table = document.getElementById("absence");

  for (let k = 1; k <= 5; k++){
    for (let i = 1; i <= 12; i += 2){
      const className = timetableData[(k-1)*6 + (i-1)/2 + 101];

      // ここでクリアして、空きコマにした場所にボタンが残るのを防ぐ
      const cell = table.rows[i].cells[k];
      cell.textContent = ""; // クリア

      // 空きコマじゃないとき、ボタンと欠時数を設置
      if (className != '空きコマ'){
        const span = document.createElement("span");
        span.className = "absence-count";
        span.textContent = Number(absenceData[className]) + Number(absence2Data[className]);
        cell.appendChild(span);
      }else{
        cell.textContent = "-";
      }
    }
  }

  // 総欠時数変更
  allAbsence();
}


// 欠時数を変える
// (*, 変える欠時数, 変えない欠時数, *)
async function changeAbsence(className, absenceDoc, absence2Doc, operation){
  // 現在のローカル欠時数を取得
  const current = absenceDoc[className];
  // 欠時数増減倍率取得(name="absenceScale" のラジオボタンのうち、チェックされているものを取得)
  const scale = Number(document.querySelector('input[name="absenceScale"]:checked').value);
  // 0以下なら変更しない
  if (current - scale < 0 && operation == -1) return;

  // ローカルで新しい欠時数を定義
  let newValue = 0;
  newValue = current + scale*operation;

  // ローカル欠時数変更
  absenceDoc[className] = newValue;

  // UI欠時数を変更
  setButton(absenceDoc, absence2Doc)

  // DB更新
  if (document.querySelector('input[name="semester"]:checked').value == 'first'){
    const docRef = doc(db, userId, 'absence');
    await updateDoc(docRef, { [className]: newValue });
  }else{
    const docRef = doc(db, userId, 'absence2');
    await updateDoc(docRef, { [className]: newValue });
  }

  // 総欠時数表示
  allAbsence();
}


// 総欠時表示
function allAbsence(){
  let allAbsence = 0;
  for (const key in absenceData){
    allAbsence += absenceData[key];
  }
  for (const key in absence2Data){
    allAbsence += absence2Data[key];
  }
  document.getElementById("allAbsence").textContent = `年間総欠時：${allAbsence}`;
}


// 時間割モーダルの初期化
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

  // モーダル内授業ボタン
  modal.addEventListener('click', async e => {
    if (e.target.classList.contains('modal-btn')){
      await changeTimetable(e.target.id);
      setTimetable();
      if (document.querySelector('input[name="semester"]:checked').value == 'first'){
        setButton(absenceData, absence2Data);
      }else if(document.querySelector('input[name="semester"]:checked').value == 'second'){
        setButton(absence2Data, absenceData);
      }else{
        setAbsenceAll();
      }
      modal.style.display = 'none';
    }
  });
}


// セルをタップしたらモーダルを開く
function attachCellEvents(){
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
        <h3>${'月火水木金'[col-1]}曜${row},${row+1}限</h3>
        <h3>授業一覧</h3>
      `;
      for (let k = 0; k < Object.keys(data).length; k++){
        html += `<button id="m${i},${k}" class="modal-btn">${data[k]}</button>`;
      }
      body.innerHTML = html;

      // モーダル表示
      modal.style.display = 'block';
    });
  });
}


// 時間割変更
async function changeTimetable(id){
  // ボタンIdを配列に(時間割番号, 授業番号)
  const btnId = id.slice(1).split(',');

  // DBに触ってる
  const timetableDocRef = doc(db, userId, 'timetable');
  const absenceDocRef = doc(db, userId, 'absence');
  const absence2DocRef = doc(db, userId, 'absence2');

  // -- 新規追加授業名取得 --
  // 曜日別時間割データ取得
  const timetableWeek = await getData('timetable_week', String(Number(btnId[0]) + 101));
  const newClassName = timetableWeek[Number(btnId[1])];

  // 現在の時間割配列を作成
  let currentTimetable = [];
  for (let t = 101; t < 131; t++){
    currentTimetable.push(timetableData[t]);
  }

  // キャッシュにしておく
  let newDoc = {}; // 新規授業情報
  let currentDoc = {}; // 既存授業情報
  let newCredit = 0; // 新規授業単位数
  let currentCredit = 0; // 既存授業単位数
  let elseI = 0;  // 既存授業が4単位の時、もう片方の場所
  let de1 = '';
  let de2 = '';
  const i = Number(btnId[0]); // 変更箇所
  const currentClassName = currentTimetable[i]; // 既存授業名
  const timetables = {};  // 新しい時間割オブジェクト


  // 以下同じ授業でないとして、時間割変更
  if (newClassName != currentClassName){

    // 必要なドキュメントをまとめて取得
    [newDoc, currentDoc] = await Promise.all([
      getData('timetable_name', newClassName),
      getData('timetable_name', currentClassName)
    ]);

    // 単位数をまとめて取得
    newCredit = newDoc.credit; // 新規授業単位数
    currentCredit = currentDoc.credit; // 既存授業単位数

    // 既存授業が4単位の時、もう片方の場所を定義しておく
    if (currentCredit == 4){
      const currentWeek1 = currentDoc.week1;
      const currentWeek2 = currentDoc.week2;
      const currentHour = currentDoc.hour;
      if (i == currentWeek1*6 + currentHour){
        elseI = currentWeek2*6 + currentHour;
      }else{
        elseI = currentWeek1*6 + currentHour;
      }
    }

    // 配列操作
    if (newCredit == 4){
      // 新規授業が4単位の時、両方の場所を保存しておく
      de1 = currentTimetable[newDoc.week1*6 + newDoc.hour];
      de2 = currentTimetable[newDoc.week2*6 + newDoc.hour];

      // 既存授業単位数
      if (currentCredit == 4){
        // もう片方の情報
        const elseDoc = await getData('timetable_name', currentTimetable[elseI]);
        if (elseDoc.credit == 4){
          // もう片方の4単位を、全部空きコマにする
          currentTimetable[elseDoc.week1*6 + elseDoc.hour] = '空きコマ';
          currentTimetable[elseDoc.week2*6 + elseDoc.hour] = '空きコマ';

          // 既存授業のもう片方を空きコマにする
          currentTimetable[elseI] = '空きコマ';
        }
      }

      // 授業登録
      currentTimetable[newDoc.week1*6 + newDoc.hour] = newClassName;
      currentTimetable[newDoc.week2*6 + newDoc.hour] = newClassName;
    }else{
      if (currentCredit == 4){
        currentTimetable[elseI] = '空きコマ';
      }
    }

    // 一律で登録箇所に登録
    currentTimetable[i] = newClassName;

    // DB更新
    for (let k = 0; k < 30; k++){
      timetables[k+101] = currentTimetable[k];
    }
    await updateDoc(timetableDocRef, timetables);
  }else{
    // 同じ授業なら既存オブジェクトをそのまま返す
    for (let k = 0; k < 30; k++){
      timetables[k+101] = currentTimetable[k];
    }
  }
  // ローカル変数に反映
  Object.assign(timetableData, timetables);


  // 以下同じ授業でないとして、欠時数変更
  if (newClassName != currentClassName){
    // 欠時削除
    if (newCredit == 4){
      if (de1 != de2){
        if (de1 != '空きコマ'){
          await Promise.all([
            updateDoc(absenceDocRef, { [de1]: deleteField() }),
            updateDoc(absence2DocRef, { [de1]: deleteField() })
          ]);
          delete absenceData[de1];
          delete absence2Data[de1];
        }
        if (de2 != '空きコマ'){
          await Promise.all([
            updateDoc(absenceDocRef, { [de2]: deleteField() }),
            updateDoc(absence2DocRef, { [de2]: deleteField() })
          ]);
          delete absenceData[de2];
          delete absence2Data[de2];
        }
      }else{
        if (de1 != '空きコマ'){
          await Promise.all([
            updateDoc(absenceDocRef, { [de1]: deleteField() }),
            updateDoc(absence2DocRef, { [de1]: deleteField() })
          ]);
          delete absenceData[de1];
          delete absence2Data[de1];
        }
      }
    }else{
      if (currentCredit != 0){
        await Promise.all([
          updateDoc(absenceDocRef, { [currentClassName]: deleteField() }),
          updateDoc(absence2DocRef, { [currentClassName]: deleteField() })
        ]);
        delete absenceData[currentClassName];
        delete absence2Data[currentClassName];
      }
    }

    // 欠時追加
    if (newClassName != '空きコマ'){
      const newAbsence = { [newClassName]: 0 };
      await Promise.all([
        updateDoc(absenceDocRef, newAbsence),
        updateDoc(absence2DocRef, newAbsence)
      ]);
      Object.assign(absenceData, newAbsence);
      Object.assign(absence2Data, newAbsence);
    }
  }
}


// 今日の曜日に赤枠をつける
function highlightToday(){
  // 曜日配列（日曜=0, 月曜=1, ...）
  const dayOfWeek = new Date().getDay();

  // 1〜5（月〜金）のときのみ処理
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    // テーブル内のthを取得
    const thsT = document.querySelectorAll("#timetable thead th");
    const thsA = document.querySelectorAll("#absence thead th");

    // 例: 月なら1番目（0は「時限」）
    const targetThT = thsT[dayOfWeek];
    targetThT.classList.add("todayHeader");
    const targetThA = thsA[dayOfWeek];
    targetThA.classList.add("todayHeader");
  }
}


// 本日欠席機能
function todayAbsence(){
  // ボタンを取得
  const saveButton = document.getElementById("todayAbsence");

  // クリックイベントを登録
  saveButton.addEventListener("click", async () => {
    // 曜日取得
    const now = new Date();
    const day = now.getDay() - 1; // 0=日曜, 1=月曜, ... 6=土曜

    // 土日は授業がない
    if (day == 0 || day == 6){
      alert('本日定時制課程の授業はありません。');
      return;
    }

    // 時間割取得
    const timetableDoc = [];
    for (let i = 0; i < 6; i++){
      if (timetableData[(day-1)*6 + i + 101] != '空きコマ'){
        timetableDoc.push(timetableData[(day-1)*6 + i + 101]);
      }
    }

    // 欠時数取得
    const absenceDoc = {};
    if (checkHalf()){
      Object.assign(absenceDoc, absenceData);
    }else{
      Object.assign(absenceDoc, absence2Data);
    }

    // 新しい欠時情報
    const newAbsenceDoc = {};
    // 何欠つけるのか一気に調べる
    const promises = timetableDoc.map(name => getData('timetable_name', name));
    const classDatas = await Promise.all(promises);
    for (let i = 0; i < timetableDoc.length; i++){
      const credit = classDatas[i].credit;
      const addNumber = `${'21'[credit%2]}`;
      // 新規欠時代入
      newAbsenceDoc[timetableDoc[i]] =
      Number(absenceDoc[timetableDoc[i]]) + Number(addNumber);
    }

    // DB,ローカル変数更新
    if (checkHalf()){
      const docRef = doc(db, userId, 'absence');
      await updateDoc(docRef, newAbsenceDoc);
      Object.assign(absenceData, newAbsenceDoc);
    }else{
      const docRef = doc(db, userId, 'absence2');
      await updateDoc(docRef, newAbsenceDoc);
      Object.assign(absence2Data, newAbsenceDoc);
    }

    // UI更新
    if (document.querySelector('input[name="semester"]:checked').value == 'first'){  
      setButton(absenceData, absence2Data);
    }else if(document.querySelector('input[name="semester"]:checked').value == 'second'){
      setButton(absence2Data, absenceData);
    }else{
      setAbsenceAll();
    }

    alert("本日の欠席を登録しました。");
  });
}


// 欠時数テーブル切り替え
function setupHalfRadio(){

  // デフォルト値を設定
  if (checkHalf()){
    document.getElementById("first").checked = true;
  }else{
    document.getElementById("second").checked = true;
  }

  const radios = document.querySelectorAll('input[name="semester"]');

  radios.forEach(radio => {
    radio.addEventListener('change', async () => {
      if (radio.value == 'first'){
        setButton(absenceData, absence2Data);
      }else if(radio.value == 'second'){
        setButton(absence2Data, absenceData);
      }else{
        setAbsenceAll();
      }
    });
  });
}


// 前期後期を表示
function changeHalf(){
  if (checkHalf()){
    document.getElementById("halfC").textContent = '前期期間(~10/9)';
  }else{
    document.getElementById("halfC").textContent = '後期期間(10/10~)';
  }
}


// 前期後期判定
function checkHalf(){
  const now = new Date();
  const month = now.getMonth() + 1; // 1~12
  const day = now.getDate(); // 1〜31

  if (month <= 3) return false; // 1~3月は後期
  if (month < changeMonth) return true; // changeMonthより前なら前期
  if (month > changeMonth) return false; // changeMonthより後なら後期
  if (day <= changeDay) return true; // changeMonthの月かつchangeDay以下なら前期
  return false; // あと後期
}


// 本日欠席の説明を作成
function todayExplanation(){
  if (checkHalf()){
    document.getElementById("absenceTitle").textContent = '前期の欠時数が増えます';
  }else{
    document.getElementById("absenceTitle").textContent = '後期の欠時数が増えます';
  }
}


// userId表示
function setUserId(){
  const userIdElem = document.getElementById("userId");
  userIdElem.textContent = userId;

  console.log(getComputedStyle(document.getElementById("userId")).fontSize);
  console.log(getComputedStyle(document.getElementById("a")).fontSize);
}


// 最初の読み込み時にliffを完成させる
function firstChange(){
  setUserId();
  changeHalf();
  todayExplanation();
  setTimetable();
  if (checkHalf()){ // 欠時数時間割に欠時数と欠時変更ボタンを設置
    setButton(absenceData, absence2Data);
  }else{
    setButton(absence2Data, absenceData);
  }
  highlightToday();
}



// メインの処理
async function main(){
  // DB初期化
  await initFirebase();
  // liff初期化とuserId取得
  userId = await firstLiff();

  // ユーザーの時間割情報と欠時数情報を取得
  [timetableData, absenceData, absence2Data] = await Promise.all([
    getData(userId, 'timetable'),
    getData(userId, 'absence'),
    getData(userId, 'absence2')
  ]);


  // liff画面を完成させる
  firstChange();

  // 欠時数テーブル切り替え
  setupHalfRadio();

  // 時間割モーダル表示と内容セット
  initModal();
  attachCellEvents();

  // 本日欠席機能
  todayAbsence();
}


main();