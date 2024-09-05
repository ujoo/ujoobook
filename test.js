const { google } = require('googleapis');
const OAuth2Client = google.auth.OAuth2;

const oAuth2Client = new OAuth2Client(
  "571525506881-av7vs0bu56lvu2ckm8pf0u2657oukins.apps.googleusercontent.com",
  "vtLyQERDZxRl2XA2Hqd9Sx1z",
  "http://localhost:8080"
);

// 새로운 인증 URL 생성
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

// 이 URL을 브라우저에서 열고 인증 코드 받아오기
console.log('Authorize this app by visiting this url:', authUrl);

//{
//    "installed":{
//        "client_id":"571525506881-av7vs0bu56lvu2ckm8pf0u2657oukins.apps.googleusercontent.com",
//        "project_id":"ujoo74",
//        "auth_uri":"https://accounts.google.com/o/oauth2/auth",
//        "token_uri":"https://oauth2.googleapis.com/token",
//        "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
//        "client_secret":"vtLyQERDZxRl2XA2Hqd9Sx1z",
//        "redirect_uris":["http://localhost"]
//    }
//}