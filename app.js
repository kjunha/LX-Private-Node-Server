var express = require('express')
var http = require('http')
var bodyParser = require('body-parser')
var path = require('path');
var app = express();
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.set('port', process.env.PORT || 8080)
var server = http.createServer(app)
var io = require('socket.io')(server)
var Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'))
var LXServiceHost = require('./build/contracts/LXServiceHost.json')

//Swagger API docs
const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express');
const e = require('express');
const options = {
    swaggerDefinition:{
        info:{
            title: 'LX 주소혁신 프로젝트 스마트계약 RESTFUL API',
            version: '1.0.0',
            description: 'LX 주소혁신 프로젝트 스마트계약 RESTFUL API Swagger doc 페이지 입니다.',
            contact: {
                name: '김준하(way2bit)',
                email: 'junha.kim@way2bit.com'
            },
        },
        servers:[
            {
                url: 'http://127.0.0.1:8080/',
                description: 'local host test server'
            }
        ],
    },
    apis: ['./app.js'],
}
const specs = swaggerJsdoc(options)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs))

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
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname + '/public/html/index.html'))
})

/**
 * SC함수: registerMember
 * 요청예시: POST http://127.0.0.1:8080/api/members + body:{"memberPk":<>}
 * @swagger
 * /api/members:
 *      post:
 *          description: 새로운 회원 등록시 registerMember 함수를 실행시키고 새로운 계정을 만들어 반환함
 *          tags:
 *              - members
 *          parameters:
 *              - name: request body
 *                in: body
 *                type: object
 *                properties:
 *                    memberPk:
 *                        type: integer
 *                required: true
 *          responses:
 *              200:
 *                description: 회원의 블록체인 주소와 개인키 반환
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      primaryKey:
 *                          type: integer
 *                          default: '111'
 *                      memberAddr:
 *                          type: string
 *                          default: '블록체인 주소'
 *                      privateKey:
 *                          type: string
 *                          default: '블록체인 주소 개인키'
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.post('/api/members', async (req,res) => {
    try{
        //--! 매번 새로운 계정을 만들어 추가하는 방식 시도 
        //--! 기존의 이미 존재하는 계정을 반환하지 않는 알고리즘 연구 필요
        var newAccount = await web3.eth.accounts.create()
        contract.methods.registerMember(newAccount.address,req.body.memberPk).send({from:admin, gas:1000000})
            .on('receipt', (receipt) => {
                console.log('success: registerMember')
                res.json({
                    'result':receipt.status,
                    'primaryKey':receipt.events.RegisterMember.returnValues[1],
                    'memberAddr':receipt.events.RegisterMember.returnValues[0],
                    'privateKey':newAccount.privateKey,
                    'status':{
                        'code':200,
                        'message':'OK'
                    }
                })
            })
            .on('error', () => {
                contract.methods.registerMember(newAccount.address,req.body.memberPk)
                    .call({from: admin}, (err, _) => {
                        console.log(`fail: registerMember, ${err}`)
                        res.json({
                            'result':false,
                            'status':{
                                'code':403,
                                'message':`${err}`
                            }
                        })
                    })
            })
    } catch(err) {
        console.log(`fail: asyncAction, ${err}`)
        res.status(403).json({
            'result':false,
            'status':{
                'code':403,
                'message':`${err}`
            }
        })
    }
})

/**
 * SC함수: deregisterMember
 * 요청예시: DELETE http://127.0.0.1:8080/api/members + body:{"memberPk":<>, "memberAddr":<address>}
 * @swagger
 * /api/members:
 *      delete:
 *          description: 회원을 삭제할 시 등록되어있는 회원주소를 받아 deregisterMemeber 함수를 실행시키고 결과를 반환함
 *          tags:
 *              - members
 *          parameters:
 *              - name: request body
 *                in: body
 *                type: object
 *                properties:
 *                    memberAddr:
 *                        type: string
 *                    memberPk:
 *                        type: integer
 *                required: true
 *          responses:
 *              200:
 *                description: 회원의 블록체인 주소 반환
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      primaryKey:
 *                          type: integer
 *                          default: 111
 *                      memberAddr:
 *                          type: string
 *                          default: "블록체인 주소"
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.delete('/api/members', (req,res) => {
    contract.methods.deregisterMember(req.body.memberAddr,req.body.memberPk).send({from:admin, gas:1000000})
    .on('receipt', (receipt) => {
        console.log('success: deregisterMember')
        res.json({
            'result':receipt.status,
            'primaryKey':receipt.events.DeregisterMember.returnValues[1],
            'memberAddr':receipt.events.DeregisterMember.returnValues[0],
            'status':{
                'code':200,
                'message':'OK'
            }
        })
    })
    .on('error', () => {
        contract.methods.deregisterMember(req.body.memberAddr,req.body.memberPk)
            .call({from:admin}, (err, _) => {
                console.log(`fail: registerMember, ${err}`)
                res.status(403).json({
                    'result':false,
                    'status':{
                        'code':403,
                        'message':`${err}`
                    }
                })
            })
    })
})

/**
 * SC함수: registerResidence
 * 요청예시: POST http://127.0.0.1:8080/api/residences + body:{"memberAddr":<>, "residenceNum":<>, "myGeonick":<>, "gs1":<>, "streetAddr":<>, "gridAddr":<>}
 * @swagger
 * /api/residences:
 *      post:
 *          description: 새로운 주소정보를 등록시 registerResidence 함수를 실행시키고 결과값을 반환함
 *          tags:
 *              - residences
 *          parameters:
 *              - name: request body
 *                in: body
 *                type: object
 *                properties:
 *                    memberAddr:
 *                        type: string
 *                    residenceNum:
 *                        type: integer
 *                    myGeonick:
 *                        type: string
 *                    gs1:
 *                        type: string
 *                    streetAddr:
 *                        type: string
 *                    gridAddr:
 *                        type: string
 *                required: true
 *          responses:
 *              200:
 *                description: 저장된 주소정보 및 기록된 블록번호 반환. 새로 생성되는 주소는 이전에 기록되었던 블록이 존재하지 않음으로 previousBlock은 0으로 반환됨
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      memberAddr:
 *                          type: string
 *                      residenceNum:
 *                          type: integer
 *                      currentBlock:
 *                          type: integer
 *                      previousBlock:
 *                          type: integer
 *                      myGeonick:
 *                          type: string
 *                      gs1:
 *                          type: string
 *                      streetAddr:
 *                          type: string
 *                      gridAddr:
 *                          type: string
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.post('/api/residences', (req,res) => {
    contract.methods.registerResidence(req.body.memberAddr, req.body.residenceNum, req.body.myGeonick, req.body.gs1, req.body.streetAddr, req.body.gridAddr)
        .send({from: admin, gas:1000000})
        .on('receipt',(receipt) => {
            console.log('success: registerResidence')
            res.json({
                'result':receipt.status,
                'memberAddr':receipt.events.ChangeResidence.returnValues[0],
                'residenceNum':receipt.events.ChangeResidence.returnValues[1],
                'currentBlock':receipt.events.ChangeResidence.returnValues[2],
                'previousBlock':receipt.events.ChangeResidence.returnValues[3],
                'myGeonick':receipt.events.ChangeResidence.returnValues[4],
                'gs1':receipt.events.ChangeResidence.returnValues[5],
                'streetAddr':receipt.events.ChangeResidence.returnValues[6],
                'gridAddr':receipt.events.ChangeResidence.returnValues[7],
                'status':{
                    'code':200,
                    'message':'OK'
                }
            })
        })
        .on('error', () => {
            contract.methods.registerResidence(req.body.memberAddr, req.body.residenceNum, req.body.myGeonick, req.body.gs1, req.body.streetAddr, req.body.gridAddr)
                .call({from: admin}, (err, _) => {
                    console.log(`fail: registerResidence, ${err}`)
                    res.status(403).json({
                        'result':false,
                        'status':{
                            'code':403,
                            'message':`${err}`
                        }
                    })
                })
        })
})

/**
 * SC함수: updateResidence
 * 요청예시: PATCH http://127.0.0.1:8080/api/residences/<residenceNum> + body:{"memberAddr":<address>, "myGeonick":<>, "gs1":<>, "streetAddr":<>, "gridAddr":<>}
 * @swagger
 * /api/residences/{residenceNum}:
 *      patch:
 *          description: 기존 주소정보를 업데이트시 updateResidence 함수를 실행시키고 결과값을 반환함. 기존의 정보에서 변경되지 않고 유지되는 정보는 ""로 넘겨져야 함.
 *          tags:
 *              - residences
 *          parameters:
 *              - name: request body
 *                in: body
 *                type: object
 *                properties:
 *                    memberAddr:
 *                        type: string
 *                    myGeonick:
 *                        type: string
 *                    gs1:
 *                        type: string
 *                    streetAddr:
 *                        type: string
 *                    gridAddr:
 *                        type: string
 *                required: true
 *              - name: residenceNum
 *                in: path
 *                type: integer
 *                required: true
 *          responses:
 *              200:
 *                description: 저장된 주소정보 및 기록된 블록번호 반환
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      memberAddr:
 *                          type: string
 *                      residenceNum:
 *                          type: integer
 *                      currentBlock:
 *                          type: integer
 *                      previousBlock:
 *                          type: integer
 *                      myGeonick:
 *                          type: string
 *                      gs1:
 *                          type: string
 *                      streetAddr:
 *                          type: string
 *                      gridAddr:
 *                          type: string
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.patch('/api/residences/:residenceNum', (req,res) => {
    contract.methods.updateResidence(req.body.memberAddr, req.params.residenceNum, req.body.myGeonick, req.body.gs1, req.body.streetAddr, req.body.gridAddr)
    .send({from: admin, gas:1000000})
    .on('receipt',(receipt) => {
        console.log('success: updateResidence')
        res.json({
            'result':receipt.status,
            'memberAddr':receipt.events.ChangeResidence.returnValues[0],
            'residenceNum':receipt.events.ChangeResidence.returnValues[1],
            'currentBlock':receipt.events.ChangeResidence.returnValues[2],
            'previousBlock':receipt.events.ChangeResidence.returnValues[3],
            'myGeonick':receipt.events.ChangeResidence.returnValues[4],
            'gs1':receipt.events.ChangeResidence.returnValues[5],
            'streetAddr':receipt.events.ChangeResidence.returnValues[6],
            'gridAddr':receipt.events.ChangeResidence.returnValues[7],
            'status':{
                'code':200,
                'message':'OK'
            }
        })
    })
    .on('error', () => {
        contract.methods.updateResidence(req.body.memberAddr, req.params.residenceNum, req.body.myGeonick, req.body.gs1, req.body.streetAddr, req.body.gridAddr)
            .call({from: admin}, (err,_) => {
                console.log(`fail: updateResidence, ${err}`)
                res.status(403).json({
                    'result':false,
                    'status':{
                        'code':403,
                        'message':`${err}`
                    }
                })
            })
    })
})

/**
 * SC함수: deleteResidence
 * 요청예시: DELETE http://127.0.0.1:8080/api/residences + body:{"memberAddr":<address>, "residenceNum":<>}
 * @swagger
 * /api/residences/{residenceNum}:
 *      delete:
 *          description: 기존 주소정보를 삭제시 deleteResidence 함수를 실행시키고 결과값을 반환함
 *          tags:
 *              - residences
 *          parameters:
 *              - name: request body
 *                in: body
 *                type: object
 *                properties:
 *                    memberAddr:
 *                        type: string
 *                required: true
 *              - name: residenceNum
 *                in: path
 *                type: integer
 *                required: true
 *          responses:
 *              200:
 *                description: 삭제된 주소정보 및 삭제가 기록된 블록번호 반환. currentBlock이 삭제 이벤트가 기록된 블록의 번호임.
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      memberAddr:
 *                          type: string
 *                      residenceNum:
 *                          type: integer
 *                      currentBlock:
 *                          type: integer
 *                      previousBlock:
 *                          type: integer
 *                      myGeonick:
 *                          type: string
 *                      gs1:
 *                          type: string
 *                      streetAddr:
 *                          type: string
 *                      gridAddr:
 *                          type: string
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.delete('/api/residences/:residenceNum', (req,res) => {
    contract.methods.deleteResidence(req.body.memberAddr, req.params.residenceNum)
        .send({from: admin, gas:1000000})
        .on('receipt',(receipt) => {
            console.log('success: deleteResidence')
            res.json({
                'result':receipt.status,
                'memberAddr':receipt.events.DeleteResidence.returnValues[0],
                'residenceNum':receipt.events.DeleteResidence.returnValues[1],
                'currentBlock':receipt.events.DeleteResidence.returnValues[2],
                'previousBlock':receipt.events.DeleteResidence.returnValues[3],
                'myGeonick':receipt.events.DeleteResidence.returnValues[4],
                'gs1':receipt.events.DeleteResidence.returnValues[5],
                'streetAddr':receipt.events.DeleteResidence.returnValues[6],
                'gridAddr':receipt.events.DeleteResidence.returnValues[7],
                'status':{
                    'code':200,
                    'message':'OK'
                }
            })
        })
        .on('error', () => {
            contract.methods.deleteResidence(req.body.memberAddr, req.params.residenceNum)
                .call({from: admin}, (err,_) => {
                    console.log(`fail: deleteResidence, ${err}`)
                    res.status(403).json({
                        'result':false,
                        'status':{
                            'code':403,
                            'message':`${err}`
                        }
                    })
                })
        })
})

/**
 * SC함수: allowAccessTo
 * 요청예시: POST http://127.0.0.1:8080/api/residences/<residenceNum>/usage-consent + body:{"memberAddr":<address>, "requestAddr":<address>, "approvalStat":<boolean>}
 * @swagger
 * /api/residences/{residenceNum}/usage-consent:
 *      post:
 *          description: 기관에 주소정보를 활용할 수 있는 권한을 부여하는 allowAccessTo 함수를 실행시키고 결과값을 반환함
 *          tags:
 *              - residences
 *          parameters:
 *              - name: request body
 *                in: body
 *                description: 회원의 주소와 기관의 주소를 포함하며, approbalStat이 true일시 승인요청, approvalStat이 false일시 승인해제 요청임.
 *                type: object
 *                properties:
 *                    memberAddr:
 *                        type: string
 *                    requestAddr:
 *                        type: string
 *                    approvalStat:
 *                        type: boolean
 *                required: true
 *              - name: residenceNum
 *                in: path
 *                type: integer
 *                required: true
 *          responses:
 *              200:
 *                description: 승인 혹은 승인해제가 이루어진 주소의 고유번호와 주소 고유번호 소유자의 주소, 기관의 주소가 반환됨
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      memberAddr:
 *                          type: string
 *                      requestAddr:
 *                          type: string
 *                      residenceNum:
 *                          type: integer
 *                      approvalStat:
 *                          type: boolean
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.post('/api/residences/:residenceNum/usage-consent', (req,res) => {
    contract.methods.allowAccessTo(req.body.memberAddr, req.body.requestAddr, req.params.residenceNum, req.body.approvalStat)
        .send({from: admin, gas:1000000})
        .on('receipt',(receipt) => {
            console.log('success: allowAccess')
            res.json({
                'result':receipt.status,
                'memberAddr':receipt.events.PreConsentTo.returnValues[0],
                'requestAddr':receipt.events.PreConsentTo.returnValues[1],
                'residenceNum':receipt.events.PreConsentTo.returnValues[2],
                'approvalStat':receipt.events.PreConsentTo.returnValues[3],
                'status':{
                    'code':200,
                    'message':'OK'
                }
            })
        })
        .on('error', () => {
            contract.methods.allowAccessTo(req.body.memberAddr, req.body.requestAddr, req.params.residenceNum, req.body.approvalStat)
                .call({from: admin}, (err, _) => {
                    console.log(`fail: allowAccess, ${err}`)
                    res.status(403).json({
                        'result':false,
                        'status':{
                            'code':403,
                            'message':`${err}`
                        }
                    })
                })
        })
})

//--! SC의 require처럼 함수 호출자에 대한 제한이 없어서 추가로 보안성을 구현해야 하는가?
/**
 * SC함수: 없음(web3 event 조회 요청)
 * 요청예시: GET http://127.0.0.1:8080//api/residences/:residenceNum/history?(optional)fromBlock=<>&toBlock<>
 * @swagger
 * /api/residences/{residenceNum}/history:
 *      get:
 *          description: 주어진 블록범위 내의 해당 주소 고유번호에 대한 주소정보 추가 변경 및 삭제 이벤트를 검색하여 배열로 반환. 최대 604800개의 블록 검사 가능.
 *          tags:
 *              - residences
 *          parameters:
 *              - name: residenceNum
 *                in: path
 *                type: integer
 *                required: true
 *              - name: fromBlock
 *                in: query
 *                description: 탐색을 시작할 블록의 번호. 기본값은 0
 *                type: string
 *                required: false
 *                default: 0
 *              - name: toBlock
 *                in: query
 *                description: 탐색을 마칠 블록의 번호. 기본값은 'latest'
 *                type: string
 *                required: false
 *                default: latest
 *          responses:
 *              200:
 *                description: 주어진 범위내 주소고유번호를 가진 이벤트를 탐색하여 values 배열로 반환
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      values:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  alive:
 *                                      type: boolean
 *                                  memberAddr:
 *                                      type: string
 *                                  residenceNum:
 *                                      type: string
 *                                  currentBlock:
 *                                      type: integer
 *                                  previousBlock:
 *                                      type: integer
 *                                  myGeonick:
 *                                      type: string
 *                                  gs1:
 *                                      type: string
 *                                  streetAddr:
 *                                      type: string
 *                                  gridAddr:
 *                                      type: string
 *                                  status:
 *                                      type: object
 *                                      properties:
 *                                          code:
 *                                            type: integer
 *                                            default: 200  
 *                                          message:
 *                                            type: string
 *                                            default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.get('/api/residences/:residenceNum/history', (req,res) => {
    var fromBlock
    var toBlock
    web3.eth.getBlockNumber().then((bn) => {
        if(req.query.fromBlock == undefined) {
            if(bn > 86400) {
                fromBlock = bn - 86400
            } else {
                fromBlock = 0;
            }
        } else {
            fromBlock = req.query.fromBlock
        }
        if(req.query.toBlock == undefined) {
            if(bn > fromBlock + 86400) {
                toBlock = fromBlock + 86400
            } else {
                toBlock = bn;
            }
        } else if(req.query.toBlock.valueOf() == 'latest'){
            toBlock = bn
        } else {
            toBlock = req.query.toBlock
        }
        if(fromBlock <= toBlock && toBlock <= bn && toBlock - fromBlock <= 604800) {
            //ChangeResidence 이벤트를 검색해서 values 배열안에 담음
            contract.getPastEvents('ChangeResidence',{filter:{_residenceNum:[req.params.residenceNum]},fromBlock:fromBlock,toBlock:toBlock},
            (err, event) => {
                if(event) {
                    console.log('success: lookupHistory')
                    values = event.map((element)=>{
                        return {
                            'alive':true,
                            'memberAddr':element.returnValues[0],
                            'residenceNum':element.returnValues[1],
                            'currentBlock':element.returnValues[2],
                            'previousBlock':element.returnValues[3],
                            'myGeonick':element.returnValues[4],
                            'gs1':element.returnValues[5],
                            'streetAddr':element.returnValues[6],
                            'gridAddr':element.returnValues[7]
                        }
                    })
                    //DeleteResidence 이벤트를 검색해서 values_sub 배열에 담은 후 values 배열에 합침
                    contract.getPastEvents('DeleteResidence', {filter:{_residenceNum:[req.params.residenceNum]},fromBlock:fromBlock,toBlock:toBlock},
                        (err_sub, event_sub) => {
                            if(event_sub) {
                                values_sub = event_sub.map((element) => {
                                    return {
                                        'memberAddr':element.returnValues[0],
                                        'residenceNum':element.returnValues[1],
                                        'alive': false,
                                        'currentBlock':element.returnValues[2],
                                        'previousBlock':element.returnValues[3],
                                        'myGeonick':element.returnValues[4],
                                        'gs1':element.returnValues[5],
                                        'streetAddr':element.returnValues[6],
                                        'gridAddr':element.returnValues[7]
                                    }
                                })
                                //두 배열 합치기
                                values = values.concat(values_sub)
                                //배열을 시간순으로 정렬함
                                values.sort((i,j) => {
                                    let comparison = 0
                                    let numI = parseInt(i.currentBlock)
                                    let numJ = parseInt(j.currentBlock)
                                    if(numI > numJ) {
                                        comparison = 1
                                    } else if(numI < numJ) {
                                        comparison = -1
                                    }
                                    return comparison
                                })
                                res.json({
                                    'result':true, 
                                    'values':values, 
                                    'status':{
                                        'code':200,
                                        'message':'OK'
                                    }
                                })
                            } else {
                                console.log(`fail: lookupHistory, ${err_sub}`)
                                res.status(403).json({
                                    'result':false,
                                    'status':{
                                        'code':403,
                                        'message':`${err_sub}`
                                    }
                                })
                            }
                            
                        }
                    )        
                } else {
                    console.log(`fail: lookupHistory, ${err}`)
                    res.status(403).json({
                        'result':false,
                        'status':{
                            'code':403,
                            'message':`${err}`
                        }
                    })
                }
            })
        } else {
            console.log(`fail: lookupHistory, BLOCK_NUMBER_RANGE_EXCEED (${fromBlock}, ${toBlock})`)
            res.status(403).json({
                'result':false, 
                'status':{
                    'code':403,
                    'message':'BLOCK_NUMBER_RANGE_EXCEED'
                }
            })
        }
    })
})

/**
 * SC함수: getResidence
 * 요청예시: GET http://127.0.0.1:8080/api/residences?reqFrom=<address>&residenceNum=<residenceNum>
 * @swagger
 * /api/residences:
 *      get:
 *          description: 주소 고유등록번호(primaryKey)를 활용해서 주소정보를 검색함. 활용동의가 되지 않았을 시 result값이 false가 되며 나머지 값이 빈 문자열로 반환됨
 *          tags:
 *              - residences
 *          parameters:
 *              - name: reqFrom
 *                in: query
 *                type: string
 *                required: true
 *              - name: residenceNum
 *                in: query
 *                type: integer
 *                required: true
 *          responses:
 *              200:
 *                description: 요청기관이 주소정보 활용 사전승인이 되어있었을 시 result에 true를 반환하며 저장된 주소정보를 반환. 사전승인이 되지 않은 경우 result에 false를 반환하며 주소정보들이 빈칸으로 반환됨
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      myGeonick:
 *                          type: string
 *                      gs1:
 *                          type: string
 *                      streetAddr:
 *                          type: string
 *                      gridAddr:
 *                          type: string
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.get('/api/residences', (req,res) => {
    contract.methods.getResidence(req.query.reqFrom, req.query.residenceNum).call({from: admin}, (err, result) => {
        if(result) {
            console.log(`success: getResidence`)
            contract.methods.getResidence(req.query.reqFrom, req.query.residenceNum).send({from: admin, gas:1000000})
            res.json({
                'result':result[0],
                'myGeonick':result[1],
                'gs1':result[2],
                'streetAddr':result[3],
                'gridAddr':result[4],
                'status':{
                    'code':200,
                    'message':'OK'
                }
            })
        } else {
            console.log(`fail: getResidence, ${err}`)
            res.status(403).json({
                'result':false, 
                'status':{
                    'code':403,
                    'message':`${err}`
                }
            })
        }
    })
})

//--! 사전허가를 확인하지 않고 요청이오면 항상 해당 주소정보를 리턴함으로 사용시 보안 필요
/**
 * SC함수: getRealtimeConsent
 * 요청예시: GET http://127.0.0.1:8080/api/residences/real-time?reqFrom=<address>&residenceNum=<residenceNum>
 * @swagger
 * /api/residences/real-time:
 *      get:
 *          description: 사용자측에서 실시간 동의가 이루어졌을 시 getRealtimeConsent 함수를 실행하고 결과값을 반환함.
 *          tags:
 *              - residences
 *          parameters:
 *              - name: reqFrom
 *                in: query
 *                type: string
 *                required: true
 *              - name: residenceNum
 *                in: query
 *                type: integer
 *                required: true
 *          responses:
 *              200:
 *                description: 요청기관이 사용자에게 실시간 사용동의 승인을 받은것으로 간주하고 주소정보를 리턴함
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      myGeonick:
 *                          type: string
 *                      gs1:
 *                          type: string
 *                      streetAddr:
 *                          type: string
 *                      gridAddr:
 *                          type: string
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.get('/api/residences/real-time', (req,res) => {
    contract.methods.getRealtimeConsent(req.query.reqFrom, req.query.residenceNum).call({from: admin}, (err, result) => {
        if(result) {
            console.log(`success: getResidence real-time`)
            contract.methods.getRealtimeConsent(req.query.reqFrom, req.query.residenceNum).send({from: admin, gas:1000000})
            res.json({
                'result':result[0],
                'myGeonick':result[1],
                'gs1':result[2],
                'streetAddr':result[3],
                'gridAddr':result[4],
                'status':{
                    'code':200,
                    'message':'OK'
                }
            })
        } else {
            console.log(`fail: getResidence real-time, ${err}`)
            res.status(403).json({
                'result':false, 
                'status':{
                    'code':403,
                    'message':`${err}`
                }
            })
        }
    })
})

/**
 * SC함수: getResidenceCount
 * 요청예시: GET http://127.0.0.1:8080/api/residences/count?addr=<address>
 * @swagger
 * /api/residences/count:
 *      get:
 *          description: 사용자가 등록한 주소정보의 개수를 리턴
 *          tags:
 *              - residences
 *          parameters:
 *              - name: addr
 *                in: query
 *                type: string
 *                required: true
 *          responses:
 *              200:
 *                description: 회원의 주소에 저장된 주소고유번호의 개수를 반환함
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      memberAddr:
 *                          type: string
 *                      value:
 *                          type: integer
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.get('/api/residences/count', (req,res) => {
    contract.methods.getResidenceCount(req.query.addr).call({from: admin}, (err,result) => {
        if(result) {
            res.json({
                'result':result[0],
                'memberAddr': req.query.addr, 
                'value':result[1],
                'status':{
                    'code':200,
                    'message':'OK'
                }
            })
        } else {
            res.status(403).json({
                'result':false,
                'status':{
                    'code':403,
                    'message':`${err}`
                }
            })
        }
    })
})

/**
 * SC함수: getResidenceList
 * 요청예시: GET http://127.0.0.1:8080/api/residences/list?addr=<address>
 * @swagger
 * /api/residences/list:
 *      get:
 *          description: 사용자가 등록한 모든 주소정보의 주소고유번호를 배열로 리턴
 *          tags:
 *              - residences
 *          parameters:
 *              - name: addr
 *                in: query
 *                type: string
 *                required: true
 *          responses:
 *              200:
 *                description: 회원의 주소에 저장된 주소고유번호의 전체 배열을 반환함
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      memberAddr:
 *                          type: string
 *                      value:
 *                          type: array
 *                          items:
 *                              type: integer
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.get('/api/residences/list', (req,res) => {
    contract.methods.getResidenceList(req.query.addr).call({from: admin}, (err,result) => {
        if(result) {
            res.json({
                'result':result[0],
                'memberAddr':req.query.addr, 
                'value':result[1],
                'status':{
                    'code':200,
                    'message':'OK'
                }
            })
        } else {
            res.status(403).json({
                'result':false,
                'status':{
                    'code':403,
                    'message':`${err}`
                }
            })
        }
    })
})

/**
 * SC함수: freeMyGeonick
 * 요청예시: POST http://127.0.0.1:8080/api/system/freemygeonick + body: {"myGeonick":<>, "gs1":<>}
 * @swagger
 * /api/system/freemygeonick:
 *      post:
 *          description: 기존에 등록된 안심주소의 고유성을 할당해제함 (재사용시)
 *          tags:
 *              - system
 *          parameters:
 *              - name: request body
 *                in: body
 *                type: object
 *                properties:
 *                    myGeonick:
 *                        type: string
 *                    gs1:
 *                        type: string
 *                required: true
 *          responses:
 *              200:
 *                description: 함수 성공여부
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 200  
 *                              message:
 *                                type: string
 *                                default: "OK"
 *              403:
 *                  description: 스마트계약 요구조건을 만족하지 못함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.post('/api/system/freemygeonick', (req,res) => {
    contract.methods.freeMyGeonick(req.body.myGeonick, req.body.gs1).send({from: admin, gas:1000000})
        .on('receipt', (receipt) => {
            res.json({
                'result':receipt.status,
                'status':{
                    'code':200,
                    'message':'OK'
                }
            })
        })
        .on('error', () => {
            contract.methods.freeMyGeonick(req.body.myGeonick, req.body.gs1)
                .call({from: admin}, (err, _) => {
                    res.status(403).json({
                        'result':false, 
                        'status':{
                            'code':403,
                            'message':`${err}`
                        }
                    })
                })
        })
})
/**
 * 모든 회원등록, 탈퇴관련 이벤트 조회
 * SC함수: 없음(web3 event 조회 요청)
 * @swagger
 * 'api/system/events/member':
 *      get:
 *          description: 주어진 블록범위 내의 회원기록 관련 이벤트를 검색하여 배열로 반환. 최대 604800개의 블록 검사 가능.
 *          tags:
 *              - system
 *          parameters:
 *              - name: fromBlock
 *                in: query
 *                description: 탐색을 시작할 블록의 번호. 기본값은 0
 *                type: string
 *                required: false
 *                default: 0
 *              - name: toBlock
 *                in: query
 *                description: 탐색을 마칠 블록의 번호. 기본값은 'latest'
 *                type: string
 *                required: false
 *                default: latest
 *          responses:
 *              200:
 *                description: 주어진 범위내 주소고유번호를 가진 이벤트를 탐색하여 values 배열로 반환.
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      values:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  stage:
 *                                      type: string
 *                                  memberAddr:
 *                                      type: string
 *                                  memberNum:
 *                                      type: integer
 *                                  currentBlock:
 *                                      type: integer
 *                                  status:
 *                                      type: object
 *                                      properties:
 *                                          code:
 *                                            type: integer
 *                                            default: 200  
 *                                          message:
 *                                            type: string
 *                                            default: "OK"
 *              403:
 *                  description: 이벤트 검색에 실패함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.get('api/system/events/member', (req,res) => {
    var fromBlock
    var toBlock
    web3.eth.getBlockNumber().then((bn) => {
        if(req.query.fromBlock == undefined) {
            if(bn > 86400) {
                fromBlock = bn - 86400
            } else {
                fromBlock = 0;
            }
        } else {
            fromBlock = req.query.fromBlock
        }
        if(req.query.toBlock == undefined) {
            if(bn > fromBlock + 86400) {
                toBlock = fromBlock + 86400
            } else {
                toBlock = bn;
            }
        } else if(req.query.toBlock.valueOf() == 'latest'){
            toBlock = bn
        } else {
            toBlock = req.query.toBlock
        }
        if(fromBlock <= toBlock && toBlock <= bn && toBlock - fromBlock <= 604800) {
            contract.getPastEvents('RegisterMember',{fromBlock:fromBlock,toBlock:toBlock},
            (err, event) => {
                if(event) {
                    console.log('success: getMemberEventLog')
                    values = event.map((element)=>{
                        return {
                            'stage':'register',
                            'memberAddr':element.returnValues[0],
                            'memberNum':element.returnValues[1],
                            'currentBlock':element.returnValues[2]
                        }
                    })
                    //DeleteResidence 이벤트를 검색해서 values_sub 배열에 담은 후 values 배열에 합침
                    contract.getPastEvents('DeregisterMember', {fromBlock:fromBlock,toBlock:toBlock},
                        (err_sub, event_sub) => {
                            if(event_sub) {
                                values_sub = event_sub.map((element) => {
                                    return {
                                        'stage':'deregister',
                                        'memberAddr':element.returnValues[0],
                                        'memberNum':element.returnValues[1],
                                        'currentBlock':element.returnValues[2]
                                    }
                                })
                                //두 배열 합치기
                                values = values.concat(values_sub)
                                //배열을 시간순으로 정렬함
                                values.sort((i,j) => {
                                    let comparison = 0
                                    let numI = parseInt(i.currentBlock)
                                    let numJ = parseInt(j.currentBlock)
                                    if(numI > numJ) {
                                        comparison = 1
                                    } else if(numI < numJ) {
                                        comparison = -1
                                    }
                                    return comparison
                                })
                                res.json({
                                    'result':true, 
                                    'values':values, 
                                    'status':{
                                        'code':200,
                                        'message':'OK'
                                    }
                                })
                            } else {
                                console.log(`fail: getMemberEventLog:Deregister, ${err_sub}`)
                                res.status(403).json({
                                    'result':false,
                                    'status':{
                                        'code':403,
                                        'message':`${err_sub}`
                                    }
                                })
                            }
                            
                        }
                    )        
                } else {
                    console.log(`fail: getMemberEventLog:Register, ${err}`)
                    res.status(403).json({
                        'result':false,
                        'status':{
                            'code':403,
                            'message':`${err}`
                        }
                    })
                }
            })
        } else {
            console.log(`fail: lookupHistory, BLOCK_NUMBER_RANGE_EXCEED (${fromBlock}, ${toBlock})`)
            res.status(403).json({
                'result':false, 
                'status':{
                    'code':403,
                    'message':'BLOCK_NUMBER_RANGE_EXCEED'
                }
            })
        }
    })
})
/**
 * 모든 주소정보 등록, 변경 삭제관련 이벤트 조회
 * SC함수: 없음(web3 event 조회 요청)
 * @swagger
 * api/system/events/residence:
 *      get:
 *          description: 주어진 블록범위 내의 주소정보 생성 변경 및 삭제 이벤트를 검색하여 배열로 반환. 최대 604800개의 블록 검사 가능.
 *          tags:
 *              - system
 *          parameters:
 *              - name: fromBlock
 *                in: query
 *                description: 탐색을 시작할 블록의 번호. 기본값은 0
 *                type: string
 *                required: false
 *                default: 0
 *              - name: toBlock
 *                in: query
 *                description: 탐색을 마칠 블록의 번호. 기본값은 'latest'
 *                type: string
 *                required: false
 *                default: latest
 *          responses:
 *              200:
 *                description: 주어진 범위내 주소고유번호를 가진 이벤트를 탐색하여 values 배열로 반환
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      values:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  alive:
 *                                      type: boolean
 *                                  memberAddr:
 *                                      type: string
 *                                  residenceNum:
 *                                      type: string
 *                                  currentBlock:
 *                                      type: integer
 *                                  previousBlock:
 *                                      type: integer
 *                                  myGeonick:
 *                                      type: string
 *                                  gs1:
 *                                      type: string
 *                                  streetAddr:
 *                                      type: string
 *                                  gridAddr:
 *                                      type: string
 *                                  status:
 *                                      type: object
 *                                      properties:
 *                                          code:
 *                                            type: integer
 *                                            default: 200  
 *                                          message:
 *                                            type: string
 *                                            default: "OK"
 *              403:
 *                  description: 이벤트 검색에 실패함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.get('api/system/events/residence', (req,res) => {
    var fromBlock
    var toBlock
    web3.eth.getBlockNumber().then((bn) => {
        if(req.query.fromBlock == undefined) {
            if(bn > 86400) {
                fromBlock = bn - 86400
            } else {
                fromBlock = 0;
            }
        } else {
            fromBlock = req.query.fromBlock
        }
        if(req.query.toBlock == undefined) {
            if(bn > fromBlock + 86400) {
                toBlock = fromBlock + 86400
            } else {
                toBlock = bn;
            }
        } else if(req.query.toBlock.valueOf() == 'latest'){
            toBlock = bn
        } else {
            toBlock = req.query.toBlock
        }
        if(fromBlock <= toBlock && toBlock <= bn && toBlock - fromBlock <= 604800) {
            //ChangeResidence 이벤트를 검색해서 values 배열안에 담음
            contract.getPastEvents('ChangeResidence',{fromBlock:fromBlock,toBlock:toBlock},
            (err, event) => {
                if(event) {
                    console.log('success: lookupHistory')
                    values = event.map((element)=>{
                        return {
                            'memberAddr':element.returnValues[0],
                            'residenceNum':element.returnValues[1],
                            'alive':true,
                            'currentBlock':element.returnValues[2],
                            'previousBlock':element.returnValues[3],
                            'myGeonick':element.returnValues[4],
                            'gs1':element.returnValues[5],
                            'streetAddr':element.returnValues[6],
                            'gridAddr':element.returnValues[7]
                        }
                    })
                    //DeleteResidence 이벤트를 검색해서 values_sub 배열에 담은 후 values 배열에 합침
                    contract.getPastEvents('DeleteResidence', {fromBlock:fromBlock,toBlock:toBlock},
                        (err_sub, event_sub) => {
                            if(event_sub) {
                                values_sub = event_sub.map((element) => {
                                    return {
                                        'memberAddr':element.returnValues[0],
                                        'residenceNum':element.returnValues[1],
                                        'alive': false,
                                        'currentBlock':element.returnValues[2],
                                        'previousBlock':element.returnValues[3],
                                        'myGeonick':element.returnValues[4],
                                        'gs1':element.returnValues[5],
                                        'streetAddr':element.returnValues[6],
                                        'gridAddr':element.returnValues[7]
                                    }
                                })
                                //두 배열 합치기
                                values = values.concat(values_sub)
                                //배열을 시간순으로 정렬함
                                values.sort((i,j) => {
                                    let comparison = 0
                                    let numI = parseInt(i.currentBlock)
                                    let numJ = parseInt(j.currentBlock)
                                    if(numI > numJ) {
                                        comparison = 1
                                    } else if(numI < numJ) {
                                        comparison = -1
                                    }
                                    return comparison
                                })
                                res.json({
                                    'result':true, 
                                    'values':values, 
                                    'status':{
                                        'code':200,
                                        'message':'OK'
                                    }
                                })
                            } else {
                                console.log(`fail: lookupHistory, ${err_sub}`)
                                res.status(403).json({
                                    'result':false,
                                    'status':{
                                        'code':403,
                                        'message':`${err_sub}`
                                    }
                                })
                            }
                            
                        }
                    )        
                } else {
                    console.log(`fail: lookupHistory, ${err}`)
                    res.status(403).json({
                        'result':false,
                        'status':{
                            'code':403,
                            'message':`${err}`
                        }
                    })
                }
            })
        } else {
            console.log(`fail: lookupHistory, BLOCK_NUMBER_RANGE_EXCEED (${fromBlock}, ${toBlock})`)
            res.status(403).json({
                'result':false, 
                'status':{
                    'code':403,
                    'message':'BLOCK_NUMBER_RANGE_EXCEED'
                }
            })
        }
    })
})
/**
 * 모든 주소정보 조회관련 이벤트 조회
 * SC함수: 없음(web3 event 조회 요청)
 * @swagger
 * api/system/events/lookup:
 *      get:
 *          description: 주어진 블록범위 내의 주소정보 열람 및 사용권한 변경 이벤트를 검색하여 배열로 반환. 최대 604800개의 블록 검사 가능.
 *          tags:
 *              - system
 *          parameters:
 *              - name: fromBlock
 *                in: query
 *                description: 탐색을 시작할 블록의 번호. 기본값은 0
 *                type: string
 *                required: false
 *                default: 0
 *              - name: toBlock
 *                in: query
 *                description: 탐색을 마칠 블록의 번호. 기본값은 'latest'
 *                type: string
 *                required: false
 *                default: latest
 *          responses:
 *              200:
 *                description: 주어진 범위내 주소고유번호를 가진 이벤트를 탐색하여 values 배열로 반환
 *                schema:
 *                  type: object
 *                  properties:
 *                      result:
 *                          type: boolean
 *                          default: true
 *                      values:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  stage:
 *                                      type: string
 *                                  memberAddr:
 *                                      type: string
 *                                  requesterAddr:
 *                                      type: string
 *                                  currentBlock:
 *                                      type: integer
 *                                  residenceNum:
 *                                      type: integer
 *                                  approvalStat:
 *                                      type: boolean
 *                                  status:
 *                                      type: object
 *                                      properties:
 *                                          code:
 *                                            type: integer
 *                                            default: 200  
 *                                          message:
 *                                            type: string
 *                                            default: "OK"
 *              403:
 *                  description: 이벤트 검색에 실패함
 *                  schema:
 *                    type: object
 *                    properties:
 *                        result:
 *                          type: boolean
 *                          default: false
 *                        status:
 *                          type: object
 *                          properties:
 *                              code:
 *                                type: integer
 *                                default: 403  
 *                              message:
 *                                type: string
 *                                default: "Error Message"
 */
app.get('api/system/events/lookup', (req,res) => {
    var fromBlock
    var toBlock
    web3.eth.getBlockNumber().then((bn) => {
        if(req.query.fromBlock == undefined) {
            if(bn > 86400) {
                fromBlock = bn - 86400
            } else {
                fromBlock = 0;
            }
        } else {
            fromBlock = req.query.fromBlock
        }
        if(req.query.toBlock == undefined) {
            if(bn > fromBlock + 86400) {
                toBlock = fromBlock + 86400
            } else {
                toBlock = bn;
            }
        } else if(req.query.toBlock.valueOf() == 'latest'){
            toBlock = bn
        } else {
            toBlock = req.query.toBlock
        }
        if(fromBlock <= toBlock && toBlock <= bn && toBlock - fromBlock <= 604800) {
            contract.getPastEvents('PreConsentTo',{fromBlock:fromBlock,toBlock:toBlock},
            (err, event) => {
                if(event) {
                    console.log('success: getMemberEventLog')
                    values = event.map((element)=>{
                        return {
                            'stage':'pre-consent',
                            'memberAddr':element.returnValues[0],
                            'requesterAddr':element.returnValues[1],
                            'currentBlock':element.returnValues[2],
                            'residenceNum':element.returnValues[3],
                            'approvalStat':element.returnValues[4],
                        }
                    })
                    //DeleteResidence 이벤트를 검색해서 values_sub 배열에 담은 후 values 배열에 합침
                    contract.getPastEvents('RealTimeConsentTo', {fromBlock:fromBlock,toBlock:toBlock},
                        (err_sub, event_sub) => {
                            if(event_sub) {
                                values_sub = event_sub.map((element) => {
                                    return {
                                        'stage':'realtime-consent',
                                        'memberAddr':element.returnValues[0],
                                        'requesterAddr':element.returnValues[1],
                                        'currentBlock':element.returnValues[2],
                                        'residenceNum':element.returnValues[3],
                                        'approvalStat':element.returnValues[4],
                                    }
                                })
                                //두 배열 합치기
                                values = values.concat(values_sub)
                                contract.getPastEvents('RequestForAddress', {fromBlock:fromBlock,toBlock:toBlock},
                                    (err_sub_sub, event_sub_sub) => {
                                        if(event_sub_sub) {
                                            values_sub_sub = event_sub_sub.map((element) => {
                                                return {
                                                    'stage':'request',
                                                    'memberAddr':'',
                                                    'requesterAddr':element.returnValues[0],
                                                    'currentBlock':element.returnValues[2],
                                                    'residenceNum':element.returnValues[1],
                                                    'approvalStat':''
                                                }
    
                                            })
                                            values = values.concat(values_sub_sub)
                                            //배열을 시간순으로 정렬함
                                            values.sort((i,j) => {
                                                let comparison = 0
                                                let numI = parseInt(i.currentBlock)
                                                let numJ = parseInt(j.currentBlock)
                                                if(numI > numJ) {
                                                    comparison = 1
                                                } else if(numI < numJ) {
                                                    comparison = -1
                                                }
                                                return comparison
                                            })
                                            res.json({
                                                'result':true, 
                                                'values':values, 
                                                'status':{
                                                    'code':200,
                                                    'message':'OK'
                                                }
                                            })
                                        } else {
                                            console.log(`fail: getLookupEventLog:RequestForAddress, ${err_sub}`)
                                            res.status(403).json({
                                                'result':false,
                                                'status':{
                                                    'code':403,
                                                    'message':`${err_sub}`
                                                }
                                            })
                                        }
                                    })
                            } else {
                                console.log(`fail: getLookupEventLog:RealTimeConsentTo, ${err_sub}`)
                                res.status(403).json({
                                    'result':false,
                                    'status':{
                                        'code':403,
                                        'message':`${err_sub}`
                                    }
                                })
                            }
                        }
                    )        
                } else {
                    console.log(`fail: getLookupEventLog:PreConsentTo, ${err}`)
                    res.status(403).json({
                        'result':false,
                        'status':{
                            'code':403,
                            'message':`${err}`
                        }
                    })
                }
            })
        } else {
            console.log(`fail: lookupHistory, BLOCK_NUMBER_RANGE_EXCEED (${fromBlock}, ${toBlock})`)
            res.status(403).json({
                'result':false, 
                'status':{
                    'code':403,
                    'message':'BLOCK_NUMBER_RANGE_EXCEED'
                }
            })
        }
    })
})