LX 주소혁신 프로젝트
===
LX 산학협력 주소혁신 프로젝트 블록체인 서버 프로토타입 입니다.
<br/>

개발자: 김준하 (Way2Bit)
<br/>

안내사항
---
** Dockerfile 빌드중... **
<br/>

시스템 요구사항
---
- solidity compiler(solc) v.0.6.2
- node.js v.14.2.0
- npm v.6.14.4
- truffle v.5.1.30
- ganache(GUI) v.2.4.0
<br/>

작동방법
---
1. 본 저장소를 적당한 위치에 clone 하고 npm install 한다.
2. truffle.js가 설치되어있지 않으면 다음 커맨드를 이용해 truffle.js를 전역으로 설치한다.
```
    npm install -g truffle
```
3. Ganache 를 설치하고 Quick Start로 실행한다.
4. 저장소의 루트 위치에서 truffle을 이용하여 Ganache의 블록체인 네트워크에 마이그레이션 한다.
```
    truffle migrate
```
5. npm start (nodemon을 이용한 Dev 환경) 혹은 node app.js로 서버를 실행한다.
6. http://127.0.0.1:8080/api-docs를 방문하여 swagger api doc을 확인한다.
<br/>