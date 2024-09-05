const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config(); // .env 파일을 로드하기 위해 dotenv 패키지 사용

// 암호화 설정
const algorithm = 'aes-256-cbc';
let secretKey = process.env.ENCRYPTION_KEY;

if (!secretKey) {
    // ENCRYPTION_KEY가 없을 경우 32바이트 랜덤 키 생성
    secretKey = crypto.randomBytes(32).toString('hex');
    console.log('새로운 ENCRYPTION_KEY가 생성되었습니다:', secretKey);

    // .env 파일에 ENCRYPTION_KEY 저장
    fs.appendFileSync('.env', `\nENCRYPTION_KEY=${secretKey}`);
}

// 16바이트 IV 생성
const iv = crypto.randomBytes(16);

// client_secret.json 파일의 내용을 읽기
const data = fs.readFileSync('client_secret.json', 'utf8');

// 암호화 수행
const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
let encrypted = cipher.update(data, 'utf8', 'hex');
encrypted += cipher.final('hex');

// IV와 암호화된 데이터를 저장
const result = `${iv.toString('hex')}:${encrypted}`;
fs.writeFileSync('client_secret.enc', result);

console.log('client_secret.json 파일이 암호화되었습니다.');
console.log('ENCRYPTION_KEY가 .env 파일에 저장되었습니다.');
