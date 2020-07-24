LX 주소혁신 프로젝트
===
LX 산학협력 주소혁신 프로젝트 블록체인 서버 프로토타입 입니다.
<br/>

개발자: 김준하 (Way2Bit) :surfer:
<br/>

:palm_tree: 깃 브랜치 정보
---
- master: Docker Image 빌드용 config (ip: 0.0.0.0)
- local: 로컬머신 빌드용 config (ip: 127.0.0.1)
<br/>

:fuelpump: 시스템 요구사항
---
- docker v.19.03
- docker-compose v.1.25
<br/>

:rocket: 작동방법
---
1. 본 저장소를 적당한 위치에 clone 하고 저장소 위치에서 docker-compose up -d를 실행한다.
```
    git clone <저장소 원격 주소> api-server
    cd api-server
    docker-compose up -d
```
2. http://127.0.0.1:8080/api-docs 에서 swagger api 문서를 확인할 수 있다.

3. 업데이트 된 내용을 반영할 경우, docker hub 에 업로도된 이미지를 먼저 pull 한 후 docker-compose 를 실행한다.
```
    docker-compose pull
    docker-compose up -d
```
<br/>

:globe_with_meridians: Network 정보
---
- 127.0.0.1:8080 >> 로컬에서 api server 주소
- 127.0.0.1:3000 >> netstat 모니터 주소
- 127.0.0.1:3001 >> explorer 모니터 주소

- 172.19.0.10:8545 >> 도커 네트워크 lxpnet 상에서의 geth 블록체인 네트워크 rpc 주소 (bootnode)
- 172.19.0.3:8080 >> 도커 네트워크 lxpnet 상에서의 api server 네트워크 주소
- 0.0.0.0:30303 >> bootnode와 다른 노드들 사이의 연결을 제공하는 포트번호

:space_invader: 디버깅 로그
----
- Geth 개발환경 네트워크로 추가구성 <br/>
    (go-ethereum/consensus/ethash 파일 내) consensus.go 파일 변경 >> 블록 채굴 난이도 고정 sealer.go 파일 변경 >> tx pending 있을시에만 블록 채굴

- 윈도우에서 쉘 스크립트가 실행되지 않는 이슈 <br/>
    윈도우 git 2.26 버전에서 clone, push or pull시 LF 파일을 CRLF 줄바꿈 형식으로 자동 변경하는 이슈로 생각됨. 윈도우 머신에서 clone 후 *.sh 파일을 LF 형식으로 지정시 문제없이 실행 가능 && .gitattributes 파일 추가하여 LF로 항상 고정

- json 반환값에 status 추가, 리턴코드와 메세지 항상 출력

- History 조회 시 DeleteResidence 이벤트 까지 조회 <br/>
    주어진 블록 범위에서 ChangeResidence 이벤트와 DeleteResidence 이벤트를 조회한 결과를 합친 후 currentBlock 번호로 정렬함

- Geth에서 revert 시 정상적으로 에러메세지 출력되지 않음 <br/>
    블록값에 변화를 주는 send 함수 실행 후 에러시에는 call함수를 호출하여 revert의 반환값을 받아 전달함

- 주소조회시 call함수로 조회하기 때문에 주소조회 이벤트 이력이 블록에 저장되지 않는 문제 <br/>
    컨트랙트에 이력 저장해주는 함수 작성 후 조회시 call 함수 뒤 send 로직 추가
