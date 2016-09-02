var token = "<SlackのAPI Token>";
var sheet_url = "<Googleスプレッドシートの共有URL>";


// Outgoing WebHooksに反応する関数
function doPost(e) {

  if( e.parameter.user_name == "slackbot" ) {
    return null;
  }

  // Custom Emojiでなければ終了
  if(!isStamp(e.parameter.text.trim())){
     throw new Error("exit");
  }

  var stamp_url = getStampURL(e.parameter.text.trim());
  // Custom Emojiに対応するスタンプURLがなければ終了
  if (stamp_url == ""){
    throw new Error("exit");
  }


  var channel_id = e.parameter.channel_id;
  var user_icon_url = getUserIconURL(e.parameter.user_id);
  
  var app = SlackApp.create(token);

  // 投稿されたスタンプの削除
  app.chatDelete(channel_id, e.parameter.timestamp);

  // 対応するスタンプURLを投稿
  app.postMessage(channel_id, stamp_url, {
    username: e.parameter.user_name,
    icon_url: getUserIconURL(e.parameter.user_id)
  });

  return true;
}


// Outgoing webhookがスタンプかどうかの判定関数
function isStamp(text){

  if (text.slice(0,1)==":" && text.slice(-1)==":") return true;
  else return false;
}

// UserIDからそのユーザアイコンのURLを取得する関数
function getUserIconURL(user_id){

  var app = SlackApp.create(token);
  var user_info = JSON.stringify(app.usersInfo(user_id));

  var start_idx = user_info.indexOf("image_72");
  var end_idx = user_info.indexOf(',', start_idx);

  return user_info.slice(start_idx+11, end_idx-1);
}

// スプレッドシートからスタンプ名に対応するオリジナルのスタンプURLを取得する関数
function getStampURL(stamp_name){

  var stamp_url = "";

  // スプレッドシートの選択
  var ss = SpreadsheetApp.openByUrl(sheet_url);
  // シートの指定
  var sheet = ss.getSheets()[0];

  var start_row = 1;
  var last_row = sheet.getLastRow();

  // シートの下から検索
  for (var r=last_row; r>=start_row; r--){
    // 値の取得
    var sn = sheet.getSheetValues(r, 1, 1, 1);

    if (sn == stamp_name){
      stamp_url = sheet.getSheetValues(r, 2, 1, 1).toString(); //toStringしておかないとindexOfがうまく動作しない

      // slackでは同じURLは展開されないためURLにUNIXTIMEを追記
      var date = new Date() ;
      if (stamp_url.indexOf("?") != -1){ // 既にGETパラメータが含まれている場合
        stamp_url += "&" + date.getTime();
      }
      else{ // 含まれていない場合
        stamp_url += "?" + date.getTime();
      }

      return stamp_url;
    }
  }

  return stamp_url;
}
