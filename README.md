LX 주소혁신 프로젝트
===
LX 산학협력 주소혁신 프로젝트 블록체인 서버 프로토타입 입니다.
<br/>

개발자: 김준하 (Way2Bit)
<br/>

깃 브랜치 정보
---
- master: Docker Image 빌드용 config (ip: 0.0.0.0)
- local: 로컬머신 빌드용 config (ip: 127.0.0.1)
<br/>

시스템 요구사항
---
- docker v.19.03
- docker-compose v.1.25
<br/>

작동방법
---
1. 본 저장소를 적당한 위치에 clone 하고 저장소 위치에서 docker-compose up -d를 실행한다.
```
    git clone <저장소 원격 주소> api-server
    cd api-server
    docker-compose up -d
```
2. http://127.0.0.1:8080/api-docs 에서 swagger api 문서를 확인할 수 있다.
<br/>

Network 정보
---
- 127.0.0.1:8080 >> 로컬에서 api server 주소
- 127.0.0.1:3000 >> netstat 모니터 주소
- 127.0.0.1:3001 >> explorer 모니터 주소

- 172.19.0.10:8545 >> 도커 네트워크 lxpnet 상에서의 geth 블록체인 네트워크 rpc 주소 (bootnode)
- 172.19.0.3:8080 >> 도커 네트워크 lxpnet 상에서의 api server 네트워크 주소
- 0.0.0.0:30303 >> bootnode와 다른 노드들 사이의 연결을 제공하는 포트번호
