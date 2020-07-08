//LXServiceServer README
//논의 필요사항
//--! 매번 새로운 계정을 만들어 추가하는 방식으로 새로운 사용자를 받는중. 미리 만들어진 계정에서 사용되지 않은 계정을 골라
//리턴하려면 어떤식으로 구성해야 할 것인가?
//--! 이번 프로젝트에 아직 정확한 적용방안은 없으나 스마트 계약에 구현되어있는 기능들을 API화 시킬것인가?
//--! 주소 조회시 조회권한이 없을때 result에 false가 리턴됨 vs 주소 조회 오류시 result에 false 리턴되면서 에러메세지 반환
//두 경우 모두 "result":false 인 현상에 대한 개선방안?
//세부 기능성은 각각의 api 참조
var express = require('express')
var http = require('http')
var bodyParser = require('body-parser')
var app = express();
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.set('port', process.env.PORT || 8080)
var server = http.createServer(app)
var io = require('socket.io')(server)
var Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'))
var LXServiceHost = require('./build/contracts/LXServiceHost.json')

//Global fields
var contract;
var accounts;
var admin;

//Server init
server.listen(app.get('port'), async () => {
    console.log('Express Server Started');
    accounts = await web3.eth.getAccounts()
    console.log(`first account: ${accounts[0]}`);
    admin = accounts[0];
    const networkId = await web3.eth.net.getId()
    const networkData = LXServiceHost.networks[networkId]
    if(networkData) {
        const abi = LXServiceHost.abi
        const address = networkData.address
        contract = new web3.eth.Contract(abi, address)
    } else {
        console.log('LXServiceHost SC is not deployed on this network')
    }
})

//Routing
//SC함수: registerMember
//요청예시: POST http://127.0.0.1:8080/api/members + body:{"memberPk":<>}
//설명: 새로운 회원 등록시 registerMember함수를 실행시키고 새로운 계정을 만들어 반환함.
app.post('/api/members', async (req,res) => {
    try{
        //--! 매번 새로운 계정을 만들어 추가하는 방식 시도 
        //--! 기존의 이미 존재하는 계정을 반환하는 알고리즘 연구 필요
        var newAccount = await web3.eth.accounts.create()
        contract.methods.registerMember(newAccount.address,req.body.memberPk).send({from:admin})
            .on('receipt', (receipt) => {
                console.log('success: registerMember')
                res.json({
                    'result':receipt.status,
                    'primaryKey':receipt.events.RegisterMember.returnValues[1],
                    'memberAddr':receipt.events.RegisterMember.returnValues[0],
                    'privateKey':newAccount.privateKey
                })
            })
            .on('error', (err) => {
                console.log(`fail: registerMember, ${err}`)
                res.json({'result':false, 'message':`${err}`})
            })
    } catch(err) {
        console.log(`fail: asyncAction, ${err}`)
        res.json({'result':false, 'message':`${err}`})
    }
})

//SC함수: deregisterMember
//요청예시: DELETE http://127.0.0.1:8080/api/members + body:{"memberPk":<>, "memberAddr":<address>}
//설명: 회원을 삭제할 시 등록되어있는 회원주소를 받아 deregisterMemeber 함수를 실행시키고 결과를 반환함
app.delete('/api/members', (req,res) => {
    contract.methods.deregisterMember(req.body.memberAddr,req.body.memberPk).send({from:admin})
    .on('receipt', (receipt) => {
        console.log('success: deregisterMember')
        res.json({
            'result':receipt.status,
            'primaryKey':receipt.events.DeregisterMember.returnValues[1],
            'memberAddr':receipt.events.DeregisterMember.returnValues[0]
        })
    })
    .on('error', (err) => {
        console.log(`fail: registerMember, ${err}`)
        res.json({'result':false, 'message':`${err}`})
    })
})

//SC함수: registerResidence
//요청예시: POST http://127.0.0.1:8080/api/residences + body:{"memberAddr":<>, "residenceNum":<>, "myGeonick":<>, "gs1":<>, "streetAddr":<>, "gridAddr":<>}
//설명: 새로운 주소정보를 등록시 registerResidence 함수를 실행시키고 결과값을 반환함
app.post('/api/residences', (req,res) => {
    contract.methods.registerResidence(req.body.memberAddr, req.body.residenceNum, req.body.myGeonick, req.body.gs1, req.body.streetAddr, req.body.gridAddr)
        .send({from: admin, gas:1000000})
        .on('receipt',(receipt) => {
            console.log('success: registerResidence')
            res.json({
                'result':receipt.status,
                'memberAddr':receipt.events.RegisterNewResidence.returnValues[0],
                'residenceNum':receipt.events.RegisterNewResidence.returnValues[1],
                'myGeonick':receipt.events.RegisterNewResidence.returnValues[2],
                'gs1':receipt.events.RegisterNewResidence.returnValues[3],
                'streetAddr':receipt.events.RegisterNewResidence.returnValues[4],
                'gridAddr':receipt.events.RegisterNewResidence.returnValues[5]
            })
        })
        .on('error', (err,_) => {
            console.log(`fail: registerResidence, ${err}`)
            res.json({'result':false, 'message':`${err}`})
        })
})

//SC함수: updateResidence
//요청예시: PATCH http://127.0.0.1:8080/api/residences/<residenceNum> + body:{"memberAddr":<address>, "myGeonick":<>, "gs1":<>, "streetAddr":<>, "gridAddr":<>}
//설명: 기존 주소정보를 업데이트시 updateResidence 함수를 실행시키고 결과값을 반환함
app.patch('/api/residences/:residenceNum', (req,res) => {
    contract.methods.updateResidence(req.body.memberAddr, req.params.residenceNum, req.body.myGeonick, req.body.gs1, req.body.streetAddr, req.body.gridAddr)
    .send({from: admin, gas:1000000})
    .on('receipt',(receipt) => {
        console.log('success: updateResidence')
        res.json({
            'result':receipt.status,
            'memberAddr':receipt.events.UpdateResidence.returnValues[0],
            'residenceNum':receipt.events.UpdateResidence.returnValues[1],
            'myGeonick':receipt.events.UpdateResidence.returnValues[2],
            'gs1':receipt.events.UpdateResidence.returnValues[3],
            'streetAddr':receipt.events.UpdateResidence.returnValues[4],
            'gridAddr':receipt.events.UpdateResidence.returnValues[5]
        })
    })
    .on('error', (err,_) => {
        console.log(`fail: updateResidence, ${err}`)
        res.json({'result':false, 'message':`${err}`})
    })
})

//SC함수: deleteResidence
//요청예시: DELETE http://127.0.0.1:8080/api/residences + body:{"memberAddr":<address>, "residenceNum":<>}
//설명: 기존 주소정보를 삭제시 deleteResidence 함수를 실행시키고 결과값을 반환함
app.delete('/api/residences', (req,res) => {
    contract.methods.deleteResidence(req.body.memberAddr, req.body.residenceNum)
        .send({from: admin, gas:1000000})
        .on('receipt',(receipt) => {
            console.log('success: registerResidence')
            res.json({
                'result':receipt.status,
                'memberAddr':receipt.events.DeleteResidence.returnValues[0],
                'residenceNum':receipt.events.DeleteResidence.returnValues[1],
                'myGeonick':receipt.events.DeleteResidence.returnValues[2],
                'gs1':receipt.events.DeleteResidence.returnValues[3],
                'streetAddr':receipt.events.DeleteResidence.returnValues[4],
                'gridAddr':receipt.events.DeleteResidence.returnValues[5]
            })
        })
        .on('error', (err,_) => {
            console.log(`fail: registerResidence, ${err}`)
            res.json({'result':false, 'message':`${err}`})
        })
})

//SC함수: allowAccessTo
//요청예시: POST http://127.0.0.1:8080/api/residences/<residenceNum>/usage-consent + body:{"memberAddr":<address>, "requestAddr":<address>, "approvalStat":<boolean>}
//설명: 기관에 주소정보를 활용할 수 있는 권한을 부여하는 allowAccessTo 함수를 실행시키고 결과값을 반환함
app.post('/api/residences/:residenceNum/usage-consent', (req,res) => {
    contract.methods.allowAccessTo(req.body.memberAddr, req.body.requestAddr, req.params.residenceNum, req.body.approvalStat)
        .send({from: admin, gas:1000000})
        .on('receipt',(receipt) => {
            console.log('success: registerResidence')
            res.json({
                'result':receipt.status,
                'memberAddr':receipt.events.PreConsentTo.returnValues[0],
                'requestAddr':receipt.events.PreConsentTo.returnValues[1],
                'residenceNum':receipt.events.PreConsentTo.returnValues[2],
                'approvalStat':receipt.events.PreConsentTo.returnValues[3],
            })
        })
        .on('error', (err,_) => {
            console.log(`fail: registerResidence, ${err}`)
            res.json({'result':false, 'message':`${err}`})
        })
})

//SC함수: getResidence
//요청예시: GET http://127.0.0.1:8080/api/residences?reqFrom=<address>&residenceNum=<residenceNum>
//설명: 주소 고유등록번호(primaryKey)를 활용해서 주소정보를 검색함. 활용동의가 되지 않았을 시 result값이 false가 되며 나머지 값이 빈 문자열로 반환됨
app.get('/api/residences', (req,res) => {
    contract.methods.getResidence(req.query.reqFrom, req.query.residenceNum).call({from: admin}, (err, result) => {
        if(result) {
            console.log(`success: getResidence`)
            res.json({
                'result':result[0],
                'myGeonick':result[1],
                'gs1':result[2],
                'streetAddr':result[3],
                'gridAddr':result[4]
            })
        } else {
            console.log(`fail: getResidence, ${err}`)
            res.json({'result':false, 'message':`${err}`})
        }
    })
})

//SC함수: getRealtimeConsent
//요청예시: GET http://127.0.0.1:8080/api/residences/real-time?reqFrom=<address>&residenceNum=<residenceNum>
//설명: 사용자측에서 실시간 동의가 이루어졌을 시 getRealtimeConsent 함수를 실행하고 결과값을 반환함.
//--!: 사전허가를 확인하지 않고 요청이오면 항상 해당 주소정보를 리턴함으로 사용시 보안 필요
app.get('/api/residences/real-time', (req,res) => {
    contract.methods.getRealtimeConsent(req.query.reqFrom, req.query.residenceNum).call({from: admin}, (err, result) => {
        if(result) {
            console.log(`success: getResidence real-time`)
            res.json({
                'result':result[0],
                'myGeonick':result[1],
                'gs1':result[2],
                'streetAddr':result[3],
                'gridAddr':result[4]
            })
        } else {
            console.log(`fail: getResidence real-time, ${err}`)
            res.json({'result':false, 'message':`${err}`})
        }
    })
})

//SC함수: getResidenceCount
//요청예시: http://127.0.0.1:8080/api/residences/count?addr=<address>
//설명: 사용자가 등록한 주소정보의 개수를 리턴
app.get('/api/residences/count', (req,res) => {
    contract.methods.getResidenceCount(req.query.addr).call({from: admin}, (err,result) => {
        if(result) {
            res.json({'result':result[0], 'value':result[1]})
        } else {
            res.json({'result':false, 'message':`${err}`})
        }
    })
})

//SC함수: getAllResidenceList
//요청예시: http://127.0.0.1:8080/api/residences/list?addr=<address>
//설명: 사용자가 등록한 모든 주소정보의 주소고유번호를 배열로 리턴
app.get('/api/residences/list', (req,res) => {
    contract.methods.getResidenceList(req.query.addr).call({from: admin}, (err,result) => {
        if(result) {
            res.json({'result':result[0], 'value':result[1]})
        } else {
            res.json({'result':false, 'message':`${err}`})
        }
    })
})

//SC함수: freeMyGeonick
//요청예시:http://127.0.0.1:8080/api/system/freemygeonick + body: {"myGeonick":<>, "gs1":<>}
//설명: 기존에 등록된 안심주소를 할당해제함 (재사용시)
app.post('/api/system/freemygeonick', (req,res) => {
    contract.methods.freeMyGeonick(req.body.myGeonick, req.body.gs1).send({from: admin})
        .on('receipt', (receipt) => {
            res.json({'result':receipt.status})
        })
        .on('error', (err,_) => {
            res.json({'result':false, 'message':`${err}`})
        })
})


