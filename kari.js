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