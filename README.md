LX 주소혁신 프로젝트
===
LX 산학협력 주소혁신 프로젝트 블록체인 서버 프로토타입 입니다.
<br/>

개발자: 김준하 (Way2Bit)
<br/>

깃 브랜치 정보
---
- master: Dockerized build config
- local: local manual build config (core)
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

모니터 적용
---
1. 프로젝트가 잘 작동한다면 monitor 디렉토리로 이동한다.
2. pm2, grunt 를 npm을 이용해 전역으로 설치한다.
```
    npm install -g pm2 grunt
```
3. monitor-api 디렉토리로 이동하여 monitoring api 서버를 구동한다.
```
    cd monitor-api
    npm install
    pm2 start app.json
    cd ..
```
4. netstats 디렉토리로 이동하여 grunt를 구성하고 eth-netstats 웹앱을 실행한다.
5. netstats 웹앱은 http://127.0.0.1:3000 에서 구동된다.
```
    cd netstats
    npm install
    grunt
    WS_SECRET=test npm start
```
6. netstat 실행후 콘솔에 다음과 같이 뜨고 아무것도 실행되지 않는다면, monitor-api 디렉토리로 다시 이동후 api 서버를 재시작 해준다.
```
    > eth-netstats@0.0.9 start /Users/junhakim/Developer/lx-proj-server/monitor/netstats
    > node ./bin/www
```
위와같은 현상 발생 시
```
    cd /path/to/project-root/monitor/monitor-api
    pm2 start app.json
```
실행 후 4,5 과정을 반복한다.
6. explorer 구동을 원할 시, 새로운 터미널창을 열어 explorer 디렉토리로 이동한 후 웹앱을 실행한다.
7. explorer 웹앱은 http://127.0.0.1:3001 에서 구동된다.
```
    cd /path/to/project-root/monitor/explorer
    npm install
    npm start 
```