var moment = require( "moment" );
var os = require( 'os' );
var http = require( "http" );
var url = require( "url" );
var async = require('async');
var sys = require( "util" );
var xml2js = require( "xml2js" );
var fs = require( "fs" );
var readline = require( "readline" );
var request = require( "request" );
var syncRequest = require( "sync-request" );
var cheerio = require( "cheerio" );

// 2024.09.01 변경 방법 start ---
const crypto = require('crypto');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();
// 2024.09.01 변경 방법 end ---

var drive;
var SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file'
];
var TOKEN_DIR = __dirname + '/credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';

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
        
                //upload to google drive
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
                
                var folderId = process.env.folderId_DIGITALTIMES;
                drive.files.create({
                    resource: {
                        name: mtit + "_" + pubdate + '.html',
                        parents : [ folderId ],
                        mimeType: 'text/html'
                    },
                    media: {
                        mimeType: 'text/html',
                        body: htmlstr
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

    //중앙일보 : 2019.10.07 이후
    app.get('/joins', function(req, res) {
        var mnm = (url.parse(req.url, true)).query.mnm;
        var mseq = (url.parse(req.url, true)).query.mseq;
        if (!mseq) mseq = 11;
        var pseq = (url.parse(req.url, true)).query.pseq;
        var pubdate = (url.parse(req.url, true)).query.pubdate;
        var h = (url.parse(req.url, true)).query.h;

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
                        }

                        //신문 내용 불러오기
                        var scrapPath = '/W/C/PubInfoList.aspx?mseq=' + mseq + '&pgi=1&pgs=20&Ctop=N';
                        if (pseq) {
                            scrapPath = '/W/C/PubCont.aspx?CImg=Y&CPdf=N&CArt=Y&CTum=N&mseq=' + mseq + '&pseq=' + pseq + '&did=121.132.121.208&ddiv=P&uid=ujoo74&h=' + h;
                        }
                        var art_date = moment().format('YYYYMMDD');

                        console.log(scrapPath);

                        //최신 발행정보 20개 불러오기
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
                                                var ia = articles[prop].ia[0];
                                                if (mseq == "11")
                                                    htmlstr += '<img src="https://jsapi.joins.com/V/' + memSeq + '/' + sec + '/1920/' + ia + '"><br>';
                                                else
                                                    htmlstr += '<img src="' + iurla + '/1920/' + ia + '"><br>';
                                            }
                                        }
                                        htmlstr += '</body></html>';

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

				if (!art_date && $("#p_date").val())
					art_date = $("#p_date").val();
				if (mseq == "ecopdf" && $("#p_date").val())
					art_date = $("#p_date").val();
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

}