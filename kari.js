// 時間割を一回配列に変えなくてもいいんじゃないかな
// 時間割変更
async function changeTimetable(id){
  // 現在の時間割を取得
  const timetableDoc = await getData(userId, 'timetable');

  // ボタンIdを配列に(時間割番号, 授業番号)
  const btnId = id.slice(1).split(',');

  // DBに触ってる
  const timetableDocRef = doc(db, userId, 'timetable');
  const absenceDocRef = doc(db, userId, 'absence');

  // -- 新規追加授業名取得 --
  // 曜日別時間割データ取得
  const timetableData = await getData('timetable_week', String(Number(btnId[0]) + 101));
  const newClassName = timetableData[btnId[1]];
  // ----

  // 現在の時間割配列を作成
  let currentTimetable = [];
  for (let t = 101; t < 131; t++){
    currentTimetable.push(timetableDoc[t]);
  }

  // キャッシュにしておく
  let newDoc = {}; // 新規授業情報
  let currentDoc = {}; // 既存授業情報
  let newCredit = 0; // 新規授業単位数
  let currentCredit = 0; // 既存授業単位数
  let elseI = 0;  // 既存授業が4単位の時、もう片方の場所
  let de1 = '';
  let de2 = '';
  const i = btnId[0]; // 変更箇所
  const currentClassName = currentTimetable[i]; // 既存授業名
  const timetables = {};  // 新しい時間割オブジェクト


  // 以下同じ授業でないとして、時間割変更
  if (newClassName != currentClassName){

    // 必要なドキュメントをまとめて取得
    newDoc = await getData('timetable_name', newClassName); // 新規授業情報
    currentDoc = await getData('timetable_name', currentClassName); // 既存授業情報

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


  // 以下同じ授業でないとして、欠時数変更
  if (newClassName != currentClassName){
    // 欠時削除
    if (newCredit == 4){
      if (de1 != de2){
        if (de1 != '空きコマ'){
          await updateDoc(absenceDocRef, { [de1]: deleteField() });
        }
        if (de2 != '空きコマ'){
          await updateDoc(absenceDocRef, { [de2]: deleteField() });
        }
      }else{
        if (de1 != '空きコマ'){
          await updateDoc(absenceDocRef, { [de1]: deleteField() });
        }
      }
    }else{
      if (currentCredit != 0){
        await updateDoc(absenceDocRef, { [currentClassName]: deleteField() });
      }
    }

    // 欠時追加
    if (newClassName != '空きコマ'){
      const newAbsence = { [newClassName]: 0 };
      await updateDoc(absenceDocRef, newAbsence);
    }
  }


  // UI反映のために新規時間割をreturnする
  return timetables;
}



/* ========================
   全体設定
   ========================= */
body {
  font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif;
  background-color: #f0f2f5;
  color: #212529;
  margin: 0px;
  line-height: 1.6; /* 行間 */
  padding: 10px; /* 内側の余白 */
  -webkit-tap-highlight-color: rgba(0,0,0,0); /* タップ時のハイライト消す */
  touch-action: manipulation; /* スクロール操作と干渉しない */
  scroll-behavior: smooth; /* スムーススクロール */
}

h1 {
  font-size: 60px;
  font-weight: 600;
  color: #000000;
  text-align: center;
  margin-bottom: 3px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2); /* 文字に影をつける */
  border-bottom: 5px solid black; /* 見出し下にライン */
}

h2 {
  font-size: 30px;
  color: #555;
  text-align: center;
  margin: 4px 0; /* 上下 左右　の順 */
}

p {
  font-size: 14px;
  color: #555;
  text-align: center;
}

table {
  width: 100%; /* 横幅いっぱい */
  table-layout: fixed; /* セルの幅を均等に */
  border: 2px solid #ddd; /* 枠線 */
  border-collapse: collapse; /* 枠線を重ねる */
  text-align: center; /* 文字を中央寄せ */
  vertical-align: middle; /* 文字を縦中央寄せ */
  background-color: #f9f9f9; /* 背景色 */
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  border-radius: 8px; /* 角を丸くする */
}

/* 時間列だけ固定幅 */
col.time-col {
  width: 60px; /* 固定幅 */
}

/* 残りの列は均等幅 */
col:not(.time-col) {
  width: calc((100% - 30px) / 5); /* 残りの幅を5等分 */
}

th {
  padding: 0; /* 内側余白 */
  font-size: 25px;
  font-weight: 400;
  height: 40px; /* セルの高さ */
  border: 3px solid #ddd;
  text-align: center; /* 文字を中央寄せ */
  vertical-align: middle; /* 文字を縦中央寄せ */
  overflow: hidden; /* はみ出た部分を隠す */
  word-break: break-word; /* 長い単語を折り返す */
  background-color: #f0f0f0;
  color: #333;
}

/* 実質時限の部分のみ */
td {
  padding: 1px; /* 内側余白 */
  font-size: 20px;
  font-weight: 400; /* 通常は400 */
  height: 40px; /* セルの高さ */
  border: 3px solid #ddd; /* 枠線 */
  border-collapse: collapse; /* 枠線を重ねる */
  text-align: center; /* 文字を中央寄せ */
  vertical-align: middle; /* 文字を縦中央寄せ */
  overflow: hidden; /* はみ出た部分を隠す */
  word-break: break-word; /* 長い単語を折り返す */
}


/* ========================
   テーブルの上
   ========================= */
.tableTitle {
  font-size: 60px;
  font-weight: 600;
  color: #06C755;
  text-align: center;
  margin-bottom: 3px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2); /* 文字に影をつける */
  border-bottom: 5px solid black; /* 見出し下にライン */
}

.tableText,
.absenceAllText {
  font-size: 30px;
  color: #555;
  text-align: center;
  margin: 4px 0; /* 上下 左右　の順 */
}


/* ========================
   時間割テーブル
   ========================= */
#timetable > .cellText {
  padding: 1px; /* 内側余白 */
  font-size: 60px;
  font-weight: 400; /* 通常は400 */
  height: 40px; /* セルの高さ */
  border: 1px solid #ddd; /* 枠線 */
  border-collapse: collapse; /* 枠線を重ねる */
  text-align: center; /* 文字を中央寄せ */
  vertical-align: middle; /* 文字を縦中央寄せ */
  overflow: hidden; /* はみ出た部分を隠す */
  word-break: break-word; /* 長い単語を折り返す */
  cursor: pointer; /* クリック可能にする */
  transition: background-color 0.2s ease; /* ホバー時の背景色変化をスムーズに */
}

#timetable > .cellText:hover {
  background-color: #e8f5e9;
}

/* ========================
   欠時数テーブル
   ========================= */
.absenceScale {
  display: inline-block;
  font-size: 30px;
  color: #555;
  text-align: center; /* 文字を中央寄せ */
  vertical-align: middle; /* 文字を縦中央寄せ */
  margin: 0 5px; /* 上下 左右　の順 */
}

.absence {
  background-color: #fff;
  margin-top: 20px; /* 上の余白 */
  padding: 14px; /* 内側の余白 */
  border-radius: 12px; /* 角を丸くする */
  box-shadow: 0 2px 6px rgba(0,0,0,0.1); /* 軽い影をつける */
}

/* == 上の部分(ラジオボタン,本日欠席)== */
.radio-group {
  display: flex;
  flex-wrap: wrap; /* 複数行に折り返す */
  justify-content: center; /* 横中央寄せ */
  align-items: center; /* 縦中央揃え */
  gap: 10px; /* 要素間の間隔 */
  margin-bottom: 14px; /* 下の余白 */
}

.radio-group h2.absenceScale {
  margin: 0; /* 上下余白リセット */
  font-size: 30px;
  color: #555;
  text-align: center;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f3f3f3;
  border-radius: 20px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 27px;
  transition: background-color 0.2s ease;
}

.radio-group label:hover {
  background: #e0e0e0;
}

.radio-group input {
  accent-color: #06C755;
  width: 27px;
  height: 27px;
}

.radio-group button#todayAbsence {
  margin: 0 30px; /* 余白 */
  padding: 10px 16px;
  font-size: 25px;
  border-radius: 10px;
  background-color: #06C755;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.radio-group button#todayAbsence:hover {
  opacity: 0.9;
}

.radio-group button#todayAbsence:active {
  transform: scale(0.98);
}

/* ==欠時数テーブル本体== */
.count {
  margin: 0 8px;
  font-weight: 600;
  font-size: 30px;
}

/* セルの背景は変わらないようにする */
#absence td {
  background-color: #fff !important;
}

/* ボタンだけクリック可能・デザイン変化 */
#absence td button {
  display: flex;
  margin: 10px auto; /* 上下の余白 */
  background-color: #06C755; /* 背景色 */
  color: #fff;
  font-weight: 400; /* 太字 */
  border: none; /* 枠線なし */
  border-radius: 10px; /* 角を丸くする */
  cursor: pointer; /* クリック可能にする */
  transition: opacity 0.2s, transform 0.1s; /* ホバーとクリック時の変化をスムーズに */
  width: auto; /* 幅自動 */
  padding: 0; /* 内側の余白 */
  font-size: 30px; /* 文字サイズ */
}

#absence td button:hover {
  opacity: 0.85; /* 少し薄くなる */
}

#absence td button:active {
  transform: scale(0.95); /* 少し縮む */
}


/* =========================
   ====== モーダル ======
   ========================= */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  inset: 0;
  background-color: rgba(0,0,0,0.4);
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background-color: #fff;
  margin: 10% auto;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  text-align: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow-y: auto;
  max-height: 80vh;
}

.modal-content .modal-btn {
  display: block;
  width: 98%;
  margin: 8px auto;
  font-size: 26px;
  padding: 14px 16px;
  border-radius: 10px;
  border: none;
  background-color: #06C755;
  color: #fff;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.2s;
}

.modal-content .modal-btn:hover {
  opacity: 0.9;
}

.modal-content .modal-btn:active {
  transform: scale(0.97);
}

/* 閉じるボタン（×） */
#closeModal {
  position: absolute;
  right: 12px;
  top: 8px;
  font-size: 38px;
  color: #777;
  cursor: pointer;
}