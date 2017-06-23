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
  
  // スプレッドシートからスタンプ画像URLを取得
  var stamp_url = getValueFromSheet(e.parameter.text.trim(), 0);
  // Custom Emojiに対応するスタンプURLがなければ終了
  if (stamp_url == ""){
    throw new Error("exit");
  }
  // slackでは同じURLは展開されないためURLにUNIXTIMEを追記
  stamp_url = addDateString(stamp_url);
  
  var channel_id = e.parameter.channel_id;
  var user_name = e.parameter.user_name;
  
  // ユーザ名からtokenの取得
  var token = getValueFromSheet(user_name, 1);
  var att = [{ "fallback": "スタンプを送信しました", "image_url": stamp_url }]
  
  // ユーザトークンの取得が成功した場合
  if (token != "") {
    var app = SlackApp.create(token);
  
    // 投稿されたスタンプの削除
    app.chatDelete(channel_id, e.parameter.timestamp);
  
    // 対応するスタンプURLを投稿
    var post_info = app.postMessage(channel_id, "", {
      attachments : JSON.stringify(att),
      as_user: true,
    });
  }
  else {
    token = token_bak;
    var icon_url = getUserIconURL(e.parameter.user_id, token);
    var app = SlackApp.create(token);
  
    // 投稿されたスタンプの削除
    app.chatDelete(channel_id, e.parameter.timestamp);
  
    // 対応するスタンプURLを投稿
    var post_info = app.postMessage(channel_id, "", {
      attachments : JSON.stringify(att),
      username: user_name,
      icon_url: icon_url,
    });
  }
  
  return true;
}


// Outgoing webhookがスタンプかどうかの判定関数
function isStamp(text){
  
  if (text.slice(0,1)==":" && text.slice(-1)==":") return true;
  else return false;
}

// UserIDからそのユーザアイコンのURLを取得する関数
function getUserIconURL(user_id, token){
  
  var app = SlackApp.create(token);
  var user_info = app.usersInfo(user_id);
  
  return user_info.user.profile.image_72;
}

// スプレッドシートからスタンプ名に対応するオリジナルのスタンプURLを取得する関数
function getValueFromSheet(target_name, sheet_no){
  
  var result = "";
  
  // スプレッドシートの選択
  var ss = SpreadsheetApp.openByUrl(sheet_url);
  // シートの指定
  var sheet = ss.getSheets()[sheet_no];
  
  var start_row = 1;
  var last_row = sheet.getLastRow();
  
  // シートの下から検索
  for (var r=last_row; r>=start_row; r--){
    // 値の取得
    var sn = sheet.getSheetValues(r, 1, 1, 1);
    
    if (sn == target_name){
      result = sheet.getSheetValues(r, 2, 1, 1).toString(); //toStringしておかないとindexOfがうまく動作しない
      
      return result;
    }
  }
  
  return result;
}

// 引数の値にunixtimeを付け加えて返却する関数
function addDateString(original){
  // UNIX TIME
  var date = new Date();
  
  if (original.indexOf("?") != -1){ // 既にGETパラメータが含まれている場合
    return original + "&" + date.getTime();
  }
  else{ // 含まれていない場合
    return original + "?" + date.getTime();
  }
}
