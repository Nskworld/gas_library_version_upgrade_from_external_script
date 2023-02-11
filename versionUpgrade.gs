/* 複数のGASのライブラリバージョンを一括で更新するスクリプト
*
*/
function main() {
  /* ライブラリバージョン一括更新のエントリポイント
  *
  */
  const targetScriptIds = targetScriptIdsList;

  console.info(`Start process.`);
  exec(targetScriptIds);
  console.info(`End process.`);
}

function exec(targetScriptIds) {
  /* ライブラリバージョン一括更新
  *
  */
  const deploymentInfo = getDeploymentInfo();
  const version = deploymentInfo["deploymentConfig"]["versionNumber"];

  targetScriptIds.forEach(targetScriptId => {
    const currentTargetFilesInfo = getFiles(targetScriptId);
    return updateVersion(currentTargetFilesInfo, targetScriptId, version);
  });

}

function getDeploymentInfo() {
  /* このGASプロジェクトのデプロイ情報を取得する
  * 　
  */
  const scriptId = ScriptApp.getScriptId();
  const deploymentId = PropertiesService.getScriptProperties().getProperty("deploymentId");
  const url = `https://script.googleapis.com/v1/projects/${scriptId}/deployments/${deploymentId}`;
  const options = createRequestOptions("GET", null);
  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() == 200) {
    return JSON.parse(response.getContentText());
  } else {
    console.error(`Failed to get Deployment ID`);
  }
}

function updateVersion(targetFilesInfo, scriptId, version) {
  /* ライブラリバージョンを更新する
  *
  */
  const url = `https://script.googleapis.com/v1/projects/${scriptId}/content`;

  const updateContents = `{
    "timeZone": "Asia/Tokyo",
    "exceptionLogging": "STACKDRIVER",
    "runtimeVersion": "V8",
    "dependencies": {
      "libraries": [{
        "userSymbol": "upgradeVersion",
        "version": ${version},
        // <libraryId>は実行対象スクリプトのものを指定
        "libraryId": "<libraryId>",
        "developmentMode": false
        }]
    }
  }`
  targetFilesInfo["files"][0]["source"] = updateContents;
  const payload = JSON.stringify(targetFilesInfo);
  const options = createRequestOptions("PUT", payload);

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() == 200) {
    console.info(`Successfully updated to version ${version}`);
  } else {
    console.error(`Failed to upgrade version.`);
    console.error(`See all response: ${response.getContentText()}`);
  }

}

function createRequestOptions(method, payload) {
  /* URLFetchする際のリクエスト情報を生成する
  *
  */
  const accessToken = ScriptApp.getOAuthToken();
  let headers = {
    "Authorization": "Bearer " + accessToken,
    "Content-Type": "application/json"
  };
  let options = {
    "method": method,
    "headers": headers,
    "muteHttpExceptions": true,
  };

  if (payload) {
    options["payload"] = payload;
  }

  return options;
}

function getFiles(scriptId) {
  /* GASプロジェクトの各ファイル情報を取得する
  *
  */
  const url = `https://script.googleapis.com/v1/projects/${scriptId}/content`;
  const options = createRequestOptions("GET", null);
  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() == 200) {
    return JSON.parse(response.getContentText());
  } else {
    console.error(`Failed to get targeted files information.`);
  }
}
