const prop = PropertiesService.getScriptProperties();
const ss = SpreadsheetApp.getActiveSpreadsheet();
const sheet_auto_transmission = ss.getSheetByName('自動送信');

/** Post a Message to Slack using Incoming Webhook
 * @param {string} text A default message to send to ``this.userId``.
 * @param {string} channel Where to report the result.
 * @param {string} username Bot's user name.
 * @param {string} icon_url Image url for Bot Icon
*/
function postSlack(text, 
                   username="LINE API", 
                   channel="#004_question", 
                   icon_url="https://avatars.githubusercontent.com/u/13128444?s=200&v=4"){
  var payload = {
    "text"     : text,
    "channel"  : channel,
    "username" : username,
    "icon_url" : icon_url,
  }
  var options = {
    "method" : "POST",
    "payload" : JSON.stringify(payload)
  }
  var url = prop.getProperty("WEBHOOK_URL");
  var response = UrlFetchApp.fetch(url, options);
  var content = response.getContentText("UTF-8");
}

/** Return the current time as a string.
 * @return {string} The current time as a string.
*/
function now_str(){
  /** Fill in the numbers with 0 to make it beautiful.
   * @param {Number} no The input number.
   * @return {string} 0 filled number.
  */
  function padLeft(no){
    no = String(no);
    let len = (2-no.length)+1;
    return len > 0? new Array(len).join('0')+no : no;  
  }
  var d = new Date
  return `${d.getFullYear()}/${padLeft(d.getMonth()+1)}/${padLeft(d.getDate())} ${padLeft(d.getHours())}:${padLeft(d.getMinutes())}:${padLeft(d.getSeconds())}`
}

// A class that handles sending messages and reporting results (to Slack and Spread Sheet)
class User {
  /** Construct the user class.
   * @param {list} rowData A row data that holds ``["name","userId","message"]`` in this order. Corresponds to one row in the spreadsheet.
   * @param {Range} result_cell Location of the sheet that describes the result. ( ``Spreadsheet.getRange("")`` )
  */
  constructor(rowData, result_cell){
    this.name    = rowData[0];
    this.userId  = rowData[1];
    this.message = rowData[2];
    this.result_cell = result_cell;
  }
  /** Set result to ``this.result_cell``
   * @param {string} message Contents to be described in ``this.reault_cell``. (Function result) 
  */
  set_result(message){
    this.result_cell.setValue(message)
  }
  /** Report the function result to the administrator.
   * @param {string} message Message to report.
   * @param {boolean} to_slack Whether to send a message to slack.
  */
  report_result(message, to_slack=false){
    this.set_result(message);
    if (to_slack){
      // postSlack(`${now_str()}\n${this.userId}: ${message}`)
      postSlack(message, this.name);
    }
  }
  // Get ``this.userId``'s profile information.
  get_profile(){
    try{
      var options = {
        "method" : "GET",
        "headers" : {
          "Content-Type" : "application/json",
          "Authorization" : "Bearer " + prop.getProperty("CHANNEL_ACCESS_TOKEN")
        },
      };
      var response = UrlFetchApp.fetch(`https://api.line.me/v2/bot/profile/${this.userId}`, options);
      return JSON.parse(response.getContentText());
    } catch(ex) {
      return {
        "displayName": "",
        "userId": "",
        "language": "",
        "pictureUrl": "",
        "statusMessage": ""
      }
    }
  }
  /** Send a message to ``this.userId``
   * @param {string} message A message to send to ``this.userId``.
  */
  send_message(message=undefined){
    if (message == undefined){
      message = this.message;
    }
    var postData = {
      "to" : this.userId,
      "messages" : [
        {
          "type" : "text",
          "text" : this.message,
        }
      ]
    };
    this.send_push_message(postData)
  }
  /** Post the data of ``postData``.
   * @reference https://developers.line.biz/en/reference/messaging-api/#send-reply-message
   * @param {Object} postData A data structure for "https://api.line.me/v2/bot/message/push"
  */
  send_push_message(postData){
    var displayName = this.get_profile().displayName;
    if (this.name == displayName){
      var options = {
        "method" : "POST",
        "headers" : {
          "Content-Type" : "application/json",
          "Authorization" : "Bearer " + prop.getProperty("CHANNEL_ACCESS_TOKEN")
        },
        "payload" : JSON.stringify(postData)
      };
      try{
        UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
        this.report_result("OK", false);     
      } catch (ex){
        this.report_result(ex.message, true)
      }
    }else{
      this.report_result(`名前 != displayName (${this.name}!=${displayName})`, true);
    }
  }
}

/** Get the column name on the spreadsheet from index.
 * @param {Number} idx Column name specified by 1-based index.
 * @return {string} Column Name.
*/
function getColName(idx) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var result = sheet.getRange(1, idx);
  result = result.getA1Notation();
  result = result.replace(/\d/,'');
  return result;
}

/** Send all messages in table[`${getColName(col)}${row}:${getColName(col+3)}`] in "自動送信" tab.
 * @param {Number} col Column index (1-based).
 * @param {Number} row Row index (1-based)
*/
function send_all_table_messages_autoTab(col, row=4) {
  var table = sheet_auto_transmission.getRange(`${getColName(col)}${row}:${getColName(col+2)}`).getValues();
  var rowIdx = 0
  while (true){
    user = new User(rowData=table[rowIdx], result_cell=sheet_auto_transmission.getRange(`${getColName(col+3)}${4+rowIdx}`))
    if (user.name=="") break
    user.send_message()
    rowIdx++;
  }
}

function send_all_messages_autoTab_manual(){
  send_all_table_messages_autoTab( 3, 4); // トリガー：手動
}

function send_all_messages_autoTab_auto(){
  send_all_table_messages_autoTab( 3, 4); // トリガー：手動
  send_all_table_messages_autoTab(10, 4); // 通常授業報告未提出
  send_all_table_messages_autoTab(17, 4); // 初回授業登録フォーム未提出
  send_all_table_messages_autoTab(24, 4); // 初回授業報告未提出
  send_all_table_messages_autoTab(31, 4); // 体験授業報告未提出
  send_all_table_messages_autoTab(38, 4); // 通常授業リマインド
  send_all_table_messages_autoTab(45, 4); // 
  send_all_table_messages_autoTab(52, 4); // 顔合わせリマインド
  send_all_table_messages_autoTab(59, 4); // 
  send_all_table_messages_autoTab(66, 4); // 初回授業リマインド
  send_all_table_messages_autoTab(73, 4); // 
  send_all_table_messages_autoTab(80, 4); // 体験授業リマインド
  send_all_table_messages_autoTab(87, 4); // 体験授業リマインド
}