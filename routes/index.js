// routes/index.js

//var Book = require(__dirname + '/../models/book');
//var User = require(__dirname + '/../models/user');
var moment = require( "moment" );
var os = require( 'os' );
var http = require( "http" );
var url = require( "url" );
var async = require('async');
var querystring = require( "querystring" );
var sys = require( "util" );
var xml2js = require( "xml2js" );
var fs = require( "fs" );
var readline = require( "readline" );
var request = require( "request" );
var syncRequest = require( "sync-request" );
var cheerio = require( "cheerio" );
// var Iconv = require( "iconv" ).Iconv;
//var iocnv = new Iconv('EUC-KR', 'UTF-8//TRANSLIT//IGNORE');
var PDFMerge = require('pdf-merge');
var jsdom = require("jsdom");

//// 2024.09.01 이전 주석 처리 start ---
//var google = require('googleapis');
//var googleAuth = require('google-auth-library');
////var plus = google.plus('v');
////var OAuth2 = google.auth.OAuth2;
//// 2024.09.01 이전 주석 처리 end ---
// 2024.09.01 변경 방법 start ---
const crypto = require('crypto');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config(); // .env 파일을 로드하기 위해 dotenv 패키지 사용
// 2024.09.01 변경 방법 end ---

var drive;
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file'
];

var TOKEN_DIR = __dirname + '/credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';



//// 2024.09.01 이전 주석 처리 start ---
//var TOKEN_DIR = __dirname + '/credentials/';
////var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/credentials/';
//var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';
//
//// Load client secrets from a local file.
//fs.readFile('client_secret.json', function processClientSecrets(err, content) {
//  if (err) {
//    console.log('Error loading client secret file: ' + err);
//    return;
//  }
//  // Authorize a client with the loaded credentials, then call the
//  // Gmail API.
//  authorize(JSON.parse(content), listLabels);
//});
///**
// * Create an OAuth2 client with the given credentials, and then execute the
// * given callback function.
// *
// * @param {Object} credentials The authorization client credentials.
// * @param {function} callback The callback to call with the authorized client.
// */
//function authorize(credentials, callback) {
//  var clientSecret = credentials.installed.client_secret;
//  var clientId = credentials.installed.client_id;
//  var redirectUrl = credentials.installed.redirect_uris[0];
//  var auth = new googleAuth();
//  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
//
//  // Check if we have previously stored a token.
//  fs.readFile(TOKEN_PATH, function(err, token) {
//    if (err) {
//      getNewToken(oauth2Client, callback);
//    } else {
//      oauth2Client.credentials = JSON.parse(token);
//      callback(oauth2Client);
//    }
//  });
//}
//
///**
// * Get and store new token after prompting for user authorization, and then
// * execute the given callback with the authorized OAuth2 client.
// *
// * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
// * @param {getEventsCallback} callback The callback to call with the authorized
// *     client.
// */
//function getNewToken(oauth2Client, callback) {
//  var authUrl = oauth2Client.generateAuthUrl({
//    access_type: 'offline',
//    scope: SCOPES
//  });
//  console.log('Authorize this app by visiting this url: ', authUrl);
//  var rl = readline.createInterface({
//    input: process.stdin,
//    output: process.stdout
//  });
//  rl.question('Enter the code from that page here: ', function(code) {
//    rl.close();
//    oauth2Client.getToken(code, function(err, token) {
//      if (err) {
//        console.log('Error while trying to retrieve access token', err);
//        return;
//      }
//      oauth2Client.credentials = token;
//      storeToken(token);
//      callback(oauth2Client);
//    });
//  });
//}
//
///**
// * Store token to disk be used in later program executions.
// *
// * @param {Object} token The token to store to disk.
// */
//function storeToken(token) {
//  try {
//    fs.mkdirSync(TOKEN_DIR);
//  } catch (err) {
//    if (err.code != 'EEXIST') {
//      throw err;
//    }
//  }
//  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
//  console.log('Token stored to ' + TOKEN_PATH);
//}
//
///**
// * Lists the labels in the user's account.
// *
// * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
// */
//function listLabels(auth) {
//    drive = google.drive({ version:'v3', auth:auth });
//}
//// 2024.09.01 이전 주석 처리 end ---


//## 2024.09.01 인증키 암호화 방식으로 변경 start ---
// 암호화 설정
const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY;

if (!secretKey) {
    throw new Error('ENCRYPTION_KEY가 설정되지 않았습니다.');
}

// 암호화된 파일 읽기
const data = fs.readFileSync('client_secret.enc', 'utf8');
const [ivHex, encryptedData] = data.split(':');
const iv = Buffer.from(ivHex, 'hex');

if (!secretKey) {
    throw new Error('Secret key must be a 32-byte Buffer');
}

// 복호화
const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
decrypted += decipher.final('utf8');

// OAuth2 클라이언트 생성 함수
async function authorize() {
    const credentials = JSON.parse(decrypted);
    const { client_secret, client_id, redirect_uris } = credentials.installed;

    try {
        console.log('OAuth2Client 생성 시도 중...');
        var oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        console.log('OAuth2Client 객체가 성공적으로 생성되었습니다.');
    } catch (error) {
        console.error('OAuth2Client 객체 생성 중 오류 발생:', error.message);
        console.error(error.stack);
    }
    //const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // 토큰 경로 확인 및 토큰 설정
    const TOKEN_PATH = path.join(__dirname, '/credentials/drive-nodejs-quickstart.json');

    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    } else {
        console.log('토큰이 없습니다. 새로 인증을 수행하세요.');
        return getAccessToken(oAuth2Client);
    }
   
}

// 새로운 액세스 토큰을 발급받는 함수
function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('Token stored to', TOKEN_PATH);
      });
    });
  }

// 예제: 구글 드라이브 API 사용
async function listFiles() {
    try {
        const auth = await authorize();
        if (!auth) {
            console.error('OAuth2 인증 실패: auth 객체를 생성하지 못했습니다.');
            return;
        }

        drive = google.drive({ version: 'v3', auth });
    } catch (error) {
        console.log("listFiles() error")
        console.error(error.message);
    }
}

// 함수 호출
//listFiles().catch(console.error);
async function initializeDriveAndUpload() {
    console.log("initializeDriveAndUpload()")
    await listFiles();
}

initializeDriveAndUpload().catch(console.error);
//## 2024.09.01 인증키 암호화 방식으로 변경 end ---


module.exports = function(app, fs)
{
    app.get('/', function(req, res) {
        var sess = req.session;

        res.render('index', {
            title : 'ujoo book',
            length: 0,
            name : sess.name,
            username : sess.username
        })
    });

    //전자신문 보기
    app.get('/etnews', function(req, res) {
        var art_date = req.params.etnewsDate;
        if (!art_date)
            art_date = req.body.etnewsDate;
        if (!art_date)
            art_date = (url.parse(req.url, true)).query.etnewsDate;
        if (!art_date)
            art_date = moment().format('YYYYMMDD');
            // art_date = moment().add(1, 'days').format('YYYYMMDD');
        //console.log(art_date);

        var pdfFiles = [];

        console.log('전자신문 정보 불러오는중...');
        console.log("http://paoin.etnews.com/?PaperDate=" + moment(art_date).format('YYYY-MM-DD'));

        // 헤더 부분
        var headers = {
            'User-Agent':       'Super Agent/0.0.1',
            'Content-Type':     'application/x-www-form-urlencoded'
        }
        
        // 요청 세부 내용
        var options = {
            url: 'http://www.paoin.com/service/Etnews/Default.aspx',
            method:'POST',
            headers: headers,
            form: {'PaperDate': moment(art_date).format('YYYY-MM-DD')}
        }
        // 요청 시작 받은값은 body
        request(options, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                //console.log(html)
                var $ = cheerio.load(html);

                var htmlstr = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>전자신문보기-' + art_date + '</title></head><body>';
                $('#newspaper ul.container li.data').each(function(i, val) {
                    imgsrc = $(val).find('img').attr('src').replace('_M140.', '_M1600.');
                    pdfFiles.push(imgsrc);
                    htmlstr += '<img src="' + imgsrc + '"><br>';
                });
                htmlstr += '</body></html>';

                if (!drive) {
                    console.error('drive 객체가 초기화되지 않았습니다.');
                    return;
                }
                //console.log(drive);
        
                //upload to google drive
                //api manual : https://developers.google.com/drive/v3/web/folder#creating_a_folder
                var folderId = process.env.folderId_ETNEWS;
                drive.files.create({
                    resource: {
                        name: art_date + '.html',
                        parents : [ folderId ],
                        mimeType: 'text/html'
                    },
                    media: {
                        mimeType: 'text/html',
                        body: htmlstr // read streams are awesome!
                    },
                    fields : 'id'
                }, function(err, file) {
                    if (err) {
                        console.log('drive.files.create error!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                        console.log(err);
                    } else {
                        console.log('completed upload google drive!')
                        //console.log(file)
                        console.log('File Id : ' + file.data.id)
                        pdfFile = 'https://drive.google.com/open?id=' + file.data.id;

                        console.log('전자신문 html create done!!!');
                        res.render('etnews', {
                            title : '전자신문',
                            etnewsDate : art_date,
                            htmlurl : 'https://drive.google.com/open?id=' + file.data.id,
                            moment : moment
                        });
                    }
                });

            } else {
                console.log(error);
            }
        });

        // var parser = new xml2js.Parser();
        // // var options = {
        // //     host: 'cp.etnews.com',
        // //     port: 80,
        // //     path: '/page_view.html?art_date=' + art_date,
        // //     headers: {
        // //         'Accept-Charset' : 'euc-kr',
        // //     }
        // // };
        // var options = {
        //     host: 'admin.rem8949.com',
        //     port: 80,
        //     path: '/system/test/getXML.asp?art_date=' + art_date,
        //     headers: {
        //         'Accept-Charset' : 'euc-kr',
        //     }
        // };

        // http.get(options, function(response){
        //     var body = "";
        //     //response.setEncoding('utf8');
        //     response.on('data', function(chunk) {
        //         body += chunk;
        //         //body += iconv.convert(chunk).toString('UTF-8');
        //     });
        //     response.on('error', function() {
        //         return;
        //     });
        //     response.on('end', function() {

        //         parser.parseString(body, function(err, result) {
        //             if (err) { console.log('전자신문 불러오기 실패!!!'); return; }

        //             var jsonObj = JSON.stringify(result);
        //             var data = JSON.parse(jsonObj);
        //             //console.log(data.article1.article2);
        //             console.log('전자신문 불러오기 끝');
        //             etnews = data.article1.article2;
        //             if (data.article1.article2) {
        //             } else {
        //                 etnews = {};
        //             }

        //             res.render('etnews', {
        //                 title : '전자신문',
        //                 etnews : etnews,
        //                 etnewsLength : etnews.length,
        //                 etnewsDate : art_date,
        //                 moment : moment
        //             });
        //         } );

        //     });
        // }).on('error', function(e) {
        //     console.log("Got error: " + e.message);
        // });
    });

    //url check
    function checkUrlExists(checkUrl) {
        let pageStatusCode;
        try {
            http.request({method:'HEAD', host:url.parse(checkUrl).host, path:url.parse(checkUrl).pathname}, (r) => {
                pageStatusCode = r.statusCode;
            }).on('error', function() {
                pageStatusCode = 0;
            }).end();
        } catch(ex) {
            console.error(ex);
        }

        return pageStatusCode;
    }

    // json 삭제
    function removeItem(obj, prop, val) {
        var c, a = new Array();
        for(c in obj) {
            if(obj[c][prop].toString() == val.toString()) {
                delete obj[c];
            } else {
                a.push(obj[c]['url']);
            }
        }
        return a;
    }

////	디지털타임즈 신문보기
app.get('/digitaltimes', function(req, res) {
    var pubdate = (url.parse(req.url, true)).query.pubdate;
    if (!pubdate)
        pubdate = moment().format('YYYY-MM-DD');
    var pubdatePageNo = (url.parse(req.url, true)).query.pubdatePageNo;
    if (!pubdatePageNo)
        pubdatePageNo = 1;
    if (pubdatePageNo < 10) pubdatePageNo = "0" + parseInt(pubdatePageNo);

    mseq = "digitaltimes";
    murl = "http://papers.eyescrap.com/dt/list.aspx"
    mparams = "__VIEWSTATE=%2FwEPDwULLTEyMTI4MTYxMjIPZBYCAgMPZBYCAgEPDxYCHgRUZXh0BQwyMDIwLiAwMi4gMDRkZBgBBR5fX0NvbnRyb2xzUmVxdWlyZVBvc3RCYWNrS2V5X18WAQUGc2VhcmNolYMfN600HecbNQpY6V%2FqftqiZfg%3D&__VIEWSTATEGENERATOR=8903B0C1&__EVENTVALIDATION=%2FwEWAwLA89HADAK4y9eRBwLH0pL8CYd3Yb%2BwJ0Cm%2F0iRYZ1uAeuEdedk&p_date=" + pubdate;
    mtit = "디지털타임즈";
    console.log(mtit + ' 정보 불러오는중...');
    console.log(murl + "?" + mparams);

    // 헤더 부분
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    // 요청 세부 내용
    var options = {
        url: murl + "?" + mparams,
        method:'GET',
        headers: headers,
    }

    var page = 0;
    // 요청 시작 받은값은 body
    request(options, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            //console.log(html)
            var $ = cheerio.load(html);

            var htmlstr = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>' + mtit + ' 보기-' + pubdate + '</title></head><body>';

            $('a').find("img").each(function(i, val) {
                if($(val).attr("src").indexOf("http://papers.eyesurfer.com/pages/" + moment(pubdate).format('YYYYMM') + "/" + moment(pubdate).format('YYYYMMDD') + "/") >= 0) {
                    imgsrc = $(val).attr('src').replace('_T.', '.');
                    htmlstr += '<img src="' + imgsrc + '"><br>';
                }
            });

            htmlstr += '</body></html>';
            
            //upload to google drive
            //api manual : https://developers.google.com/drive/v3/web/folder#creating_a_folder
            var folderId = process.env.folderId_DIGITALTIMES;
            drive.files.create({
                resource: {
                    name: mtit + "_" + pubdate + '.html',
                    parents : [ folderId ],
                    mimeType: 'text/html'
                },
                media: {
                    mimeType: 'text/html',
                    body: htmlstr // read streams are awesome!
                },
                fields : 'id'
            }, function(err, file) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('completed upload google drive!')
                    console.log('File Id : ' + file.data.id)
                    pdfFile = 'https://drive.google.com/open?id=' + file.data.id;
            
                    console.log(mtit + ' html create done!!!');
                    res.render(mseq, {
                        title : mtit,
                        pubdate : pubdate,
                        pubdatePageNo : pubdatePageNo,
                        htmlurl : 'https://drive.google.com/open?id=' + file.data.id,
                        moment : moment
                    });
                }
            });


        } else {
            console.log(error);
        }
    });

});
//    app.get('/digitaltimes', function(req, res) {
//        var pubdate = (url.parse(req.url, true)).query.pubdate;
//        if (!pubdate)
//            pubdate = moment().format('YYYYMMDD');
//        var pubdatePageNo = (url.parse(req.url, true)).query.pubdatePageNo;
//        if (!pubdatePageNo)
//            pubdatePageNo = 1;
//        if (pubdatePageNo < 10) pubdatePageNo = "0" + parseInt(pubdatePageNo);
//
//        //pdf 합치기 시작
//        var pdftkPath = 'C:\\Program Files (x86)\\PDFtk\\bin\\pdftk.exe';
//        var pdfFiles = [];
//        //면별 pdf 배열 만들기
//        for (var i=0; i < 50; i++) {
//            pageno = i;
//            if (pageno < 10) pageno = '0' + pageno;
//            pdfFiles.push('http://kpfimage.company.connect.kr/digitaltimes/' + pubdate + '/PAGE_PDF/CT01digitaltimes-' + pubdate + 'A00' + pageno + '001UDK.PDF');
//        }
//
//        async.map(pdfFiles, function(url, callback) {
//            request(url, function(error, response, html) {
//                return callback(null, {"status":response.statusCode.toString(), "url": url});
//            });
//        }, function(err, results) {
//            if (err) console.log(err);
//            else {
//                console.log('디지털타임스 pdf(면별) 주소 체크 끝 -------------------------');
//                pdfURLs = removeItem(results, "status", "404");
//                var pdfFile = '';
//                if (pdfURLs.length) {
//                    var pdfMerge = new PDFMerge(pdfURLs, pdftkPath);
//                    pdfMerge
//                    .asBuffer()
//                    .merge(function(error, buffer) {
//                        if (error) {
//                            console.log("error : " + error);
//                        }
//                        ////로컬 퐅더에 저장하기
//                        //fs.writeFileSync('./data/digitaltimesPDF/' + pubdate + '.pdf', buffer);
//
//                        //upload to google drive
//                        //api manual : https://developers.google.com/drive/v3/web/folder#creating_a_folder
//                        var folderId = process.env.folderId_DIGITALTIMES;
//                        drive.files.create({
//                            resource: {
//                                name: pubdate + '.pdf',
//                                parents : [ folderId ],
//                                mimeType: 'application/pdf'
//                            },
//                            media: {
//                                mimeType: 'application/pdf',
//                                body: buffer // read streams are awesome!
//                            },
//                            fields : 'id'
//                        }, function(err, file) {
//                            if (err) {
//                                console.log(err);
//                            } else {
//                                console.log('completed upload google drive!')
//                                console.log('File Id : ' + file.data.id)
//                                pdfFile = 'https://drive.google.com/open?id=' + file.data.id;
//
//                                console.log('디지털타임스 pdf merge done!!!');
//                                res.render('digitaltimes', {
//                                    title : '디지털타임즈 PDF 신문보기',
//                                    pubdate : pubdate,
//                                    pubdatePageNo : pubdatePageNo,
//                                    pdfFile : pdfFile,
//                                    moment : moment
//                                });
//                            }
//                        });
//                    });
//
//                    // pdfMerge.promise().then(function(result) {
//                    //     console.log('디지털타임스 pdf merge done!!!');
//                    //     res.render('digitaltimes', {
//                    //         title : '디지털타임즈 PDF 신문보기',
//                    //         pubdate : pubdate,
//                    //         pubdatePageNo : pubdatePageNo,
//                    //         pdfFile : pdfFile,
//                    //         moment : moment
//                    //     });
//                    // })
//                    // .catch(function(error) {
//                    //     console.log(error);
//                    // });
//                } else {
//                    console.log("!!! 디지털타임스 발행이 없는 날 입니다 !!!")
//                    res.render('digitaltimes', {
//                        title : '디지털타임즈 PDF 신문보기',
//                        pubdate : pubdate,
//                        pubdatePageNo : pubdatePageNo,
//                        pdfFile : '',
//                        moment : moment
//                    });
//                }
//            }
//        });
//        //pdf 합치기 종료
//    });

    //중앙일보 : 2019.10.07 이후
    app.get('/joins', function(req, res) {
        var mnm = (url.parse(req.url, true)).query.mnm;
        var mseq = (url.parse(req.url, true)).query.mseq;
        if (!mseq) mseq = 11;
        var pseq = (url.parse(req.url, true)).query.pseq;
        var pubdate = (url.parse(req.url, true)).query.pubdate;
        var h = (url.parse(req.url, true)).query.h; //아이디별 인증키(?)


        //var options = {
        //    url: 'https://www.joins.com/Media/PubList.aspx?mseq=' + mseq + '&pgs=1&pyn=y',
        //}
        //// 요청 시작 받은값은 body
        //request(options, function (error, response, html) {
        //    if (!error && response.statusCode == 200) {
        //        var $ = cheerio.load(html);
        //        console.log(html);
        //    }
        //});

		//오늘날짜 pseq 불러오기 : pseq 날짜 시퀀스
        var options = {
            url: 'https://www.joins.com/Media/List.aspx?mseq=' + mseq,
        }
        // 요청 시작 받은값은 body
        request(options, function (error, response, html) {
        	console.log("날짜 불러오기 시작");
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);

                var t = $('#container div.mhome__img2').find('button').attr('onclick');
                var ta = t.split("'").map(function (val) {
					return Number(val);
				});
                pseq = ta[1];

		        var options2 = {
		            url: 'https://www.joins.com/V2/Default.aspx?mseq=' + mseq + '&pseq=' + pseq,
		        }
		        // 요청 시작 받은값은 body
		        request(options2, function (error2, response2, html2) {
		            if (!error2 && response2.statusCode == 200) {
		            	if (!h) {
			                var $2 = cheerio.load(html2);
			                var ht = $2("head").text();
			                var i = ht.indexOf("ddiv=P&uid=&h=");
			                h = ht.substring(i+14, i+14+32);
			                //console.log($2(this).find("&ddiv=P&uid="));
			            }


						//신문 내용 불러오기
						var scrapPath = '/W/C/PubInfoList.aspx?mseq=' + mseq + '&pgi=1&pgs=20&Ctop=N';
						if (pseq) {
						    scrapPath = '/W/C/PubCont.aspx?CImg=Y&CPdf=N&CArt=Y&CTum=N&mseq=' + mseq + '&pseq=' + pseq + '&did=121.132.121.208&ddiv=P&uid=ujoo74&h=' + h;
						}
						var art_date = moment().format('YYYYMMDD');

						console.log(scrapPath);

				        //최신 발행정보 20개 불러오기
				        //https://jsapi.joins.com/W/C/PubCont.aspx?CImg=Y&CPdf=N&CArt=Y&CTum=N&mseq=11&pseq=42455&did=121.132.121.208&ddiv=P&uid=ujoo74&h=D8B12E1211DCE69F0AB1BECCAA28D8AA : 2019.10.07
				        var parser = new xml2js.Parser();
				        var options = {
				            host: 'jsapi.joins.com',
				            port: 80,
				            path: scrapPath,
				        };

				        http.get(options, function(response){
				            var body = "";
				            //response.setEncoding('utf8');
				            response.on('data', function(chunk) {
				                body += chunk;
				                //body += iconv.convert(chunk).toString('UTF-8');
				            });
				            response.on('error', function() {
				                console.log('중앙일보 매체정보(' + mnm + ') 불러오기 실패!!!');
				                return;
				            });
				            response.on('end', function() {

				                var data = JSON.parse(body);

				                console.log('중앙일보 매체정보(' + mnm + ') 불러오기 끝');
				                articles = data.rt;
				                if (data.rt) {
				                    //미디어별 날짜 선택했을 경우
				                    if (pseq) {
				// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

				                        var memSeq = data.rt.memSeq;
				                        var iurla = data.rt.iurla;
				                        var articles = data.rt.jList;
				                        var sec, ia;
				                        //console.log(articles);

						                var htmlstr = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>' + mnm + ' 보기-' + art_date + '</title></head><body>';
				                        for (var prop in articles) {
				                            var sec = articles[prop].sec;
				                            var t = articles[prop];
				                            if (articles[prop].ia) {
					                            //console.log(t);
					                            //console.log(articles[prop].ia);
					                            //console.log(articles[prop].ia.length);
					                            var ia = articles[prop].ia[0];
					                            //var ia = t[ia[0]];
					                            if (mseq == "11")
							                    	htmlstr += '<img src="https://jsapi.joins.com/V/' + memSeq + '/' + sec + '/1920/' + ia + '"><br>';
							                    else
							                    	htmlstr += '<img src="' + iurla + '/1920/' + ia + '"><br>';
											}
				                        }
						                htmlstr += '</body></html>';

						                //upload to google drive
						                //api manual : https://developers.google.com/drive/v3/web/folder#creating_a_folder
                                        var folderId = process.env.folderId_JOINS;
						                drive.files.create({
						                    resource: {
						                        name: mnm + '_' + art_date + '.html',
						                        parents : [ folderId ],
						                        mimeType: 'text/html'
						                    },
						                    media: {
						                        mimeType: 'text/html',
						                        body: htmlstr // read streams are awesome!
						                    },
						                    fields : 'id'
						                }, function(err, file) {
						                    if (err) {
						                        console.log(err);
						                    } else {
						                        console.log('completed upload google drive!')
						                        console.log('File Id : ' + file.data.id)
						                        pdfFile = 'https://drive.google.com/open?id=' + file.data.id;

						                        console.log('중앙일보 html create done!!!');
						                        res.render('etnews', {
						                            title : '중앙일보',
						                            etnewsDate : art_date,
						                            htmlurl : 'https://drive.google.com/open?id=' + file.data.id,
						                            moment : moment
						                        });
						                    }
						                });


				// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
				                    //미디어별 날짜 리스트
				                    } else {
				                        res.render('joins', {
				                            title : '중앙일보 매체별(' + mnm + ') 발행정보',
				                            pubdate : pubdate,
				                            articles : articles,
				                            articlesLength : articles.length,
				                            pdfFile : "",
				                            moment : moment
				                        });

				                    }
				                } else {
				                    articles = {};
				                    console.log('중앙일보 매체정보 정보가 존재하지 않습니다.');
				                }
				            });
				        });
				        //내용불로오기 종료

		            }
		        });

            }
        	console.log("날짜 불러오기 종료");
        });
       	console.log("내용 불러오기 시작");

    });

//    //중앙일보 : 2019.10.07 이전 함수
//    app.get('/joins', function(req, res) {
//        var mnm = (url.parse(req.url, true)).query.mnm;
//        var mseq = (url.parse(req.url, true)).query.mseq;
//        if (!mseq) mseq = 11;
//        var pseq = (url.parse(req.url, true)).query.pseq;
//        var pubdate = (url.parse(req.url, true)).query.pubdate;
//
//        var scrapPath = '/W/C/PubInfoList.aspx?mseq=' + mseq + '&pgi=1&pgs=20&Ctop=N';
//        if (pseq) {
//            scrapPath = '/W/C/PubCont.aspx?pseq=' + pseq + '&CPdf=Y&CArt=Y&CArtSum=Y&CTum=Y';
//        }
//
//        //최신 발행정보 20개 불러오기
//        http://api.plus.joins.com/W/C/PubInfoList.aspx?mseq=11&pgi=1&pgs=100&Ctop=N
//        var parser = new xml2js.Parser();
//        var options = {
//            host: 'api.plus.joins.com',
//            port: 80,
//            path: scrapPath,
//        };
//
//        http.get(options, function(response){
//            var body = "";
//            //response.setEncoding('utf8');
//            response.on('data', function(chunk) {
//                body += chunk;
//                //body += iconv.convert(chunk).toString('UTF-8');
//            });
//            response.on('error', function() {
//                console.log('중앙일보 매체정보(' + mnm + ') 불러오기 실패!!!');
//                return;
//            });
//            response.on('end', function() {
//
//                var data = JSON.parse(body);
//
//                console.log('중앙일보 매체정보(' + mnm + ') 불러오기 끝');
//                articles = data.rt;
//                if (data.rt) {
//                    //미디어별 날짜 선택했을 경우
//                    if (pseq) {
//// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
//
//                        //pdf 합치기 시작
//                        var pdftkPath = 'C:\\Program Files (x86)\\PDFtk\\bin\\pdftk.exe';
//                        var pdfFiles = [];
//                        var purl = data.rt.purl;
//                        var articles = data.rt.jList;
//                        //console.log(articles);
//
//                        for (var prop in articles) {
//                            var t = purl + articles[prop].pf;
//                            if (t.indexOf('pdf') >= 0) {
//                                pdfFiles.push( t.substring(0, t.indexOf('pdf')+3) );
//                            }
//                        }
//
//                        async.map(pdfFiles, function(url, callback) {
//                            request(url, function(error, rep, html) {
//                                return callback(null, {"status":rep.statusCode.toString(), "url": url});
//                            });
//                        }, function(err, results) {
//                            if (err) console.log(err);
//                            else {
//                                console.log('중앙일보 매체정보(' + mnm + ') 주소 체크 끝 -------------------------');
//                                pdfURLs = removeItem(results, "status", "404");
//
//                                var pdfMerge = new PDFMerge(pdfURLs, pdftkPath);
//                                pdfMerge
//                                .asBuffer()
//                                .merge(function(error, buffer) {
//                                    if (error) {
//                                        console.log("error : " + error);
//                                    }
//                                    fs.writeFileSync('./data/joinsPDF/' + mnm + '_' + moment().format('YYYYMMDD') + '.pdf', buffer);
//                                });
//
//                                pdfMerge.promise().then(function(result) {
//                                    console.log('중앙일보 매체별(' + mnm + ') pdf merge done!!!');
//                                    res.render('joins', {
//                                        title : '중앙일보 매체별(' + mnm + ') PDF 신문보기',
//                                        pubdate : pubdate,
//                                        articles : [],
//                                        articlesLength : 0,
//                                        pdfFile : '/data/joinsPDF/' + mnm + '_' + moment().format('YYYYMMDD') + '.pdf',
//                                        moment : moment
//                                    });
//                                })
//                                .catch(function(error) {
//                                    console.log(error);
//                                });
//                            }
//                        });
//                        //pdf 합치기 종료
//// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//                    //미디어별 날짜 리스트
//                    } else {
//                        res.render('joins', {
//                            title : '중앙일보 매체별(' + mnm + ') 발행정보',
//                            pubdate : pubdate,
//                            articles : articles,
//                            articlesLength : articles.length,
//                            pdfFile : "",
//                            moment : moment
//                        });
//
//                    }
//                } else {
//                    articles = {};
//                    console.log('중앙일보 매체정보 정보가 존재하지 않습니다.');
//                }
//            });
//        });
//
//    });

    // 한겨례신문 시작 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    //한겨례신문 보기
    app.get('/hani', function(req, res) {
        var mseq = (url.parse(req.url, true)).query.mseq;
        if (!mseq) mseq = "";
        var art_date = req.params.etnewsDate;
        if (!art_date)
            art_date = req.body.etnewsDate;
        if (!art_date)
            art_date = (url.parse(req.url, true)).query.etnewsDate;
        if (!art_date)
            art_date = moment().format('YYYYMMDD');
		var formData = "";

		switch(mseq) {
		case "h21" :
			mtit = "한겨례21";
			murl = "http://h21pdf.hani.co.kr/PaperList.aspx";
			break;
		case "ecopdf" :
			mtit = "Insight";
			murl = "http://ecopdf.hani.co.kr/PaperList.aspx";
			break;
		case "ndpdf" :
			mtit = "나들";
			murl = "http://ndpdf.hani.co.kr/PaperList.aspx";
			break;
		default :
			mseq = "hani";
			murl = "http://pdf.hani.co.kr/PaperList.aspx";
			mtit = "한겨례신문";
			formData = {'PaperDate': moment(art_date).format('YYYY-MM-DD')};
			break;
		}
        console.log(mtit + ' 정보 불러오는중...');
        console.log(murl + formData);

        // 헤더 부분
        var headers = {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        // 요청 세부 내용
        var options = {
            url: murl,
            method:'POST',
            headers: headers,
            form: formData
        }

        var page = 0;
        // 요청 시작 받은값은 body
        request(options, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                //console.log(html)
                var $ = cheerio.load(html);

                var htmlstr = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>' + mtit + ' 보기-' + art_date + '</title></head><body>';

                //$('#ctl00_ctl00_cph1_cph1_page_visible').find('a').each(function(i, val) {
                //	page = $(val).text();
				//	if (page > 0) {
				//        var url = murl + '?PaperDate=' + moment(art_date).format('YYYY-MM-DD') + '&page=' + page;
				//        var response2 = syncRequest("GET", url);
		        //        var $2 = cheerio.load(response2.getBody());
		        //        $2('#newspaper div.container').each(function(t, val) {
		        //            imgsrc = $2(val).find('img').attr('src').replace('_M140.', '_M1600.');
		        //            htmlstr += '<img src="' + imgsrc + '"><br>';
		        //        });
		        //    }
                //});

				if (!art_date && $("#p_date").val())
					art_date = $("#p_date").val();
				if (mseq == "ecopdf" && $("#p_date").val())
					art_date = $("#p_date").val();
				var lastNode = $('#ctl00_ctl00_cph1_cph1_page_visible').find('img').last();
				var lastpage = 1;
				console.log(art_date);
				if ($(lastNode).attr('src') == 'images/btn_end.gif') {
					lastpage = lastNode.parent().attr('href');
					lastpage = lastpage.replace('javascript:goPage(', '').replace(')', '');
					var loop = 1;

					while(loop) {
				        url = murl + '?PaperDate=' + moment(art_date).format('YYYY-MM-DD') + '&page=' + lastpage;
				        var response2 = syncRequest("GET", url);
		                var $2 = cheerio.load(response2.getBody());
						lastNode = $2('#ctl00_ctl00_cph1_cph1_page_visible').find('img').last();
						if ($2(lastNode).attr('src') == 'images/btn_end.gif') {
							lastpage = lastNode.parent().attr('href');
							lastpage = lastpage.replace('javascript:goPage(', '').replace(')', '');
						} else {
							$2('#ctl00_ctl00_cph1_cph1_page_visible').find('a').each(function(i, val) {
								if ($2(val).text() > lastpage)
									lastpage = $2(val).text();
							});
							loop = 0;
						}
					}

				} else {
					$('#ctl00_ctl00_cph1_cph1_page_visible').find('a').each(function(i, val) {
						if ($(val).text() > lastpage)
							lastpage = $(val).text();
					});
				}
				
				if (lastpage > 0) {
					for (var page = 1; page <= lastpage; page++) {
				        var url = murl + '?PaperDate=' + moment(art_date).format('YYYY-MM-DD') + '&page=' + page;
				        var response2 = syncRequest("GET", url);
		                var $2 = cheerio.load(response2.getBody());
		                $2('#newspaper div.container').each(function(t, val) {
		                    imgsrc = $2(val).find('img').attr('src').replace('_M140.', '_M1600.');
		                    htmlstr += '<img src="' + imgsrc + '"><br>';
		                });
		            }
	            }

                htmlstr += '</body></html>';
                
                //upload to google drive
                //api manual : https://developers.google.com/drive/v3/web/folder#creating_a_folder
                var folderId = process.env.folderId_HANI;
                drive.files.create({
                    resource: {
                        name: mtit + "_" + art_date + '.html',
                        parents : [ folderId ],
                        mimeType: 'text/html'
                    },
                    media: {
                        mimeType: 'text/html',
                        body: htmlstr // read streams are awesome!
                    },
                    fields : 'id'
                }, function(err, file) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('completed upload google drive!')
                        console.log('File Id : ' + file.data.id)
                        pdfFile = 'https://drive.google.com/open?id=' + file.data.id;
                
                        console.log(mtit + ' html create done!!!');
                        res.render('hani', {
                            title : mtit,
                            etnewsDate : art_date,
                            htmlurl : 'https://drive.google.com/open?id=' + file.data.id,
                            moment : moment
                        });
                    }
                });


            } else {
                console.log(error);
            }
        });

    });
    // 한겨례신문 종료 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    // 매경신문 시작 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    app.get('/mk', function(req, res) {
        var mseq = (url.parse(req.url, true)).query.mseq;
        if (!mseq) mseq = "";
        var art_date = req.params.etnewsDate;
        if (!art_date)
            art_date = req.body.etnewsDate;
        if (!art_date)
            art_date = (url.parse(req.url, true)).query.etnewsDate;
        if (!art_date)
            art_date = moment().format('YYYYMMDD');
		var formData = "";

		switch(mseq) {
		default :
			mseq = "mk";
			murl = "http://epaper.mk.co.kr/PaperList.aspx";
			mtit = "매경신문";
			formData = {'PaperDate': moment(art_date).format('YYYY-MM-DD')};
			break;
		}
        console.log(mtit + ' 정보 불러오는중...');
        console.log(murl + formData);

        // 헤더 부분
        var headers = {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        // 요청 세부 내용
        var options = {
            url: murl,
            method:'POST',
            headers: headers,
            form: formData
        }

        var page = 0;
        // 요청 시작 받은값은 body
        request(options, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                //console.log(html)
                var $ = cheerio.load(html);

                var htmlstr = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>' + mtit + ' 보기-' + art_date + '</title></head><body>';

				var lastNode = $('#ctl00_ctl00_cph1_cph1_page_visible').find('img').last();
				var lastpage = 1;

				if ($(lastNode).attr('src') == 'images/btn_end.gif') {
					lastpage = lastNode.parent().attr('href');
					lastpage = lastpage.replace('javascript:goPage(', '').replace(')', '');
					var loop = 1;

					while(loop) {
				        url = murl + '?PaperDate=' + moment(art_date).format('YYYY-MM-DD') + '&page=' + lastpage;
				        var response2 = syncRequest("GET", url);
		                var $2 = cheerio.load(response2.getBody());
						lastNode = $2('#ctl00_ctl00_cph1_cph1_page_visible').find('img').last();
						if ($2(lastNode).attr('src') == 'images/btn_end.gif') {
							lastpage = lastNode.parent().attr('href');
							lastpage = lastpage.replace('javascript:goPage(', '').replace(')', '');
						} else {
							$2('#ctl00_ctl00_cph1_cph1_page_visible').find('a').each(function(i, val) {
								if ($2(val).text() > lastpage)
									lastpage = $2(val).text();
							});
							loop = 0;
						}
					}

				} else {
					$('#ctl00_ctl00_cph1_cph1_page_visible').find('a').each(function(i, val) {
						if ($(val).text() > lastpage)
							lastpage = $(val).text();
					});
				}
				
				if (lastpage > 0) {
					for (var page = 1; page <= lastpage; page++) {
				        var url = murl + '?PaperDate=' + moment(art_date).format('YYYY-MM-DD') + '&page=' + page;
				        var response2 = syncRequest("GET", url);
		                var $2 = cheerio.load(response2.getBody());
		                $2('#newspaper div.container').each(function(t, val) {
		                    imgsrc = $2(val).find('img').attr('src').replace('_M140.', '_M1600.');
		                    htmlstr += '<img src="' + imgsrc + '"><br>';
		                });
		            }
	            }

                htmlstr += '</body></html>';
                
                //upload to google drive
                //api manual : https://developers.google.com/drive/v3/web/folder#creating_a_folder
                var folderId = process.env.folderId_MK;
                drive.files.create({
                    resource: {
                        name: mtit + "_" + art_date + '.html',
                        parents : [ folderId ],
                        mimeType: 'text/html'
                    },
                    media: {
                        mimeType: 'text/html',
                        body: htmlstr // read streams are awesome!
                    },
                    fields : 'id'
                }, function(err, file) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('completed upload google drive!')
                        console.log('File Id : ' + file.data.id)
                        pdfFile = 'https://drive.google.com/open?id=' + file.data.id;
                
                        console.log(mtit + ' html create done!!!');
                        res.render('mk', {
                            title : mtit,
                            etnewsDate : art_date,
                            mseq : mseq,
                            htmlurl : 'https://drive.google.com/open?id=' + file.data.id,
                            moment : moment
                        });
                    }
                });


            } else {
                console.log(error);
            }
        });

    });
    // 매경신문 종료 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    //조선일보 최신뉴스
    app.get('/chosun', function(req, res) {
        var parser = new xml2js.Parser();
        var options = {
            host: 'news.chosun.com',
            port: 80,
            path: '/smart/svc/latest.html?catid=mchosun&pn=',
            headers: {
                'Accept-Charset' : 'utf-8',
            }
        };

        http.get(options, function(response){
            var body = "";
            response.setEncoding('utf8');
            response.on('data', function(chunk) {
                body += chunk;
            });
            response.on('end', function() {

                parser.parseString(body, function(err, result) {
                    if (err) { console.log('조선일보 최신뉴스 불러오기 실패!!!'); return; }

                    var jsonObj = JSON.stringify(result);
                    var data = JSON.parse(jsonObj);
                    // console.log('------------------------');
                    // console.log(data.LATEST.ITEMS[0].ITEM);
                    // console.log('------------------------');
                    console.log('조선일보 최신뉴스 끝');
                    res.render('chosun', {
                        title : '조선일보 최신뉴스',
                        news : data.LATEST.ITEMS[0].ITEM,
                        pubdate : data.LATEST.PUBDATE,
                        moment : moment
                    });
                } );

            });
        }).on('error', function(e) {
            console.log("조선일보 최신뉴스 http.get error: " + e.message);
        });
    });

    //조선일보 한줄속보
    app.get('/chosun/BreakNewsView', function(req, res) {

        var news = [];
        request("http://msvr2.chosun.com/breakingnews/todayNewsList.do", function(err, response, html) {
            if (err) {
                console.log("error : " + err);
            } else {
                var $ = cheerio.load(html);
                var div = $("div");
                div.each(function(i, data) {
                    news.push({
                        "title" : $(data).find("dt").text(),
                        "time" : $(data).find("dd").text()
                    });
                });
                res.render('chosunBreakNewsView', {
                    title : '조선일보 한줄속보',
                    contents : news,
                    moment : moment
                })
            }
        });

    });
    
    app.get('/users', function(req, res) {
        User.find(function(error, users) {
            if (error) return res.status(500).send({success:0, error: 'database failure'});

            //res.json(books)
            res.render('users', {
                title : 'ujoo book',
                users:users,
                moment:moment
            })
        })

        // fs.readFile(__dirname + '/../data/user.json', 'utf-8', function(error, data) {
        //     if (error) {
        //         console.log(error);
        //     } else {
        //         res.end(data);
        //     }
        // })
    });

    app.get('/getUser/:_id', function(req, res) {
        var result = {};

        User.findOne({_id:req.params._id}, function(error, user) {
            if (error) return res.status(500).json({success:0, error:error});
            if (!user) {
                return res.status(200).json({success:0, error:'not found'+req.params._id});
            }
            res.json(user);
        });

        // var result = {};

        // fs.readFile(__dirname + '/../data/user.json', 'utf-8', function(error, data) {
        //     if (error) {
        //         console.log(error);
        //         return;
        //     }
        //     var users = JSON.parse(data);
        //     if (!users[req.params.username]) {
        //         result['success'] = 0;
        //         result['error'] = 'not found';
        //         res.json(result);
        //         return;
        //     }
        //     res.json(users[req.params.username]);
        // })
    });

    // add user data
    app.post('/addUser', function(req, res) {
        var result = {};

        User.findOne({userid:req.params.userid}, function(error, data) {
            if (error) return res.status(500).json({success:0, error:error});
            if (data) {
                return res.status(200).json({success:0, error:'duplicate'});
            }

            var user = new User();
            user.userid = req.body.userid;
            user.username = req.body.username;
            user.password = req.body.password;
            if (req.body.published_date) {
                user.published_date = new Date(req.body.published_date);
            } else {
                user.published_date = new Date();
            }

            user.save(function(error) {
                if (error) {
                    console.log(error);
                    res.json({success:0, error:error});
                    return;
                }
                res.json({success:1});
            });
        })

        // var result = {};
        // var username = req.params.username;

        // if (!req.body['password'] || !req.body['name']) {
        //     result['success'] = 0;
        //     result['error'] = 'invalid request';
        //     res.json(result);
        //     return;
        // }

        // fs.readFile(__dirname + '/../data/user.json', 'utf-8', function(error, data) {
        //     if (error) {
        //         console.log(error);
        //     } else {
        //         var users = JSON.parse(data);
        //         if(users[username]) {
        //             result['success'] = 0;
        //             result['error'] = 'duplicate';
        //             res.json(result);
        //             return;
        //         }

        //         users[username] = req.body;

        //         fs.writeFile(__dirname + '/../data/user.json', JSON.stringify(users, null, '\t'), 'utf-8', function(error, data) {
        //             result['success'] = 1;
        //             res.json(result);
        //         })
        //     }
        // })
    });

    // modify user data
    app.put('/addUser/:_id', function(req, res) {
        User.findOne({_id:req.params._id}, function(error, user) {
            if (error) return res.status(500).json({success:0, error:'database failure'});
            if (!user) return res.status(404).json({success:0, error:'user not found'});

            if(req.body.userid) user.userid = req.body.userid;
            if(req.body.username) user.username = req.body.username;
            if(req.body.password) user.password = req.body.password;
            if(req.body.published_date) user.published_date = req.body.published_date;

            user.save(function(error, saved) {
                if (error) return res.status(500).json({success:0, error:'failed to update'});
                res.json({success:1, mesage:'user updated'});
            });
        });
    });

    app.delete('/deleteUser/:_id', function(req, res) {
        User.remove({_id:req.params._id}, function(error, output) {
            if (error) return res.status(500).json({error:'database failure'});

            res.json({success:1, mesage:'delete user'});
        })
        // var result = {};

        // fs.readFile(__dirname + '/../data/user.json', 'utf-8', function(error, data) {
        //     if (error) {
        //         console.log(error);
        //     } else {
        //         var users = JSON.parse(data);
        //         if(!users[req.params.username]) {
        //             result['success'] = 0;
        //             result['error'] = 'not found';
        //             res.json(result);
        //             return;
        //         }

        //         delete users[req.params.username];
        //         fs.writeFile(__dirname + '/../data/user.json', JSON.stringify(users, null, '\n'), 'utf-8', function(error, data) {
        //             result['success'] = 1;
        //             res.json(result);
        //             return;
        //         })
        //     }
        // })
    });

    app.get('/login/:username/:password', function(req, res) {
        var sess = req.session;

        fs.readFile(__dirname + '/../data/user.json', 'utf-8', function(error, data) {
            var users = JSON.parse(data);
            var username = req.params.username;
            var password = req.params.password;
            var result = {};

            if(!users[username]) {
                result['success'] = 0;
                result['error'] = 'not found';
                res.json(result);
                return;
            }
            if (users[username]['password'] == password) {
                result['result'] = 1;
                sess.username = username;
                sess.name = users[username]['name'];
                res.json(result);
            } else {
                result['success'] = 0;
                result['error'] = 'incorrect';
                res.json(result);
            }
        })
    });

    app.get('/logout', function(req, res) {
        var sess = req.session;
        if (sess.username) {
            req.session.destroy(function(error) {
                if(error) {
                    console.log(error);
                } else {
                    res.redirect('/');
                }
            })
        } else {
            res.redirect('/');
        }
    })

    app.get('/api/books', function(req, res) {
        Book.find(function(error, books) {
            if (error) return res.status(500).send({error: 'database failure'});

            res.json(books)
        })
    });

    app.get('/api/books/:book_id', function(req, res) {
        Book.findOne({_id:req.params.book_id}, function(error, book) {
            if (error) return res.status(500).json({error:error});
            if (!book) return res.status(404).json({error:'book not found'});
            res.json(book);
        })
    });

    app.get('/api/books/author/:author', function(req, res) {
        Book.find({author:req.params.author}, {_id: 0, title: 1, published_date: 1}, function(error, books) {
            if (error) return res.status(500).json({error:error});
            if (books.length === 0) return res.status(404).json({error:'book not found'});
            res.json(books);
        })
    });

    app.post('/api/books', function(req, res) {
        var book = new Book();
        book.title = req.body.title;
        book.author = req.body.author;
        book.published_date = new Date(req.body.published_date);

        book.save(function(error) {
            if (error) {
                console.log(error);
                res.json({result:0});
                return;
            }
            res.json({result:1});
        });
    });

    app.put('/api/books/:book_id', function(req, res) {
        Book.findById(req.params.book_id, function(error, book) {
            if (error) return res.status(500).json({error:'database failure'});
            if (!book) return res.status(404).json({error:'book not found'});

            if(req.params.title) book.title = req.body.title;
            if(req.params.author) book.author = req.body.author;
            if(req.params.published_date) book.published_date = req.body.published_date;

            book.save(function(error) {
                if (error) return res.status(500).json({error:'failed to update'});
                res.json({mesage:'book updated'});
            });
        });
    });

    app.delete('/api/books/:book_id', function(req, res) {
        Book.remove({_id:req.params.book_id}, function(error, output) {
            if (error) return res.status(500).json({error:'database failure'});

            res.status(204).end();
        })
    });

}