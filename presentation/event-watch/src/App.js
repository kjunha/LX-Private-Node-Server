import React, { Component, useState } from 'react';
import dotenv from 'dotenv';
import logo from './logo.svg';
import Web3 from 'web3';
import axios from 'axios';
import { Dropdown } from 'react-bootstrap';
import './App.css';
import AddressEvent from './AddressEvent';
import MemberEvent from './MemberEvent';
import LookupEvent from './LookupEvent';
import AlertToggler from './AlertToggler';
dotenv.config();

class App extends Component {

  constructor(props) {
    super()
    console.log('web3 pre: ' + typeof window.web3)
    if(typeof window.web3 == undefined) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.web3 = new Web3(new Web3.providers.HttpProvider(`http://${process.env.REACT_APP_BC_HOST}:${process.env.REACT_APP_BC_PORT}`))
    }
    this.state = {
      account: null,
      tickInterval: null,
      checkInterval: null,
      isRunning: false,
      serviceUri: '',
      tabTitle: '회원관련 이벤트',
      currentTab: 'member',
      memberEvents: [],
      addressEvents: [],
      lookupEvents: [],
      memberCnt: 0,
      addressCnt: 0,
      lookupCnt: 0,
    }
  }

  async componentDidMount() {
    await this.loadContract()
  }

  async loadContract() {
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    const blockNumber = await web3.eth.getBlockNumber()
    const serviceUri = `http://${process.env.REACT_APP_SERVICE_HOST}:${process.env.REACT_APP_SERVICE_PORT}`
    this.setState({ 
      account: accounts[2],
      serviceUri: serviceUri,
      fromBlock: blockNumber-500000 > 0?blockNumber-600000:0
    })
  }

  swapTabs = (type) => {
    switch(type) {
      case 'member':
        this.setState({tabTitle: "회원관련 이벤트"})
        break;
      case 'address':
        this.setState({tabTitle: "주소관련 이벤트"})
        break;
      case 'lookup':
        this.setState({tabTitle: "조회관련 이벤트"})
        break;
    }
    this.setState({currentTab: type})
  }

  runListener = () => {
    // 이벤트 함수 인터벌 호출
    this.setState((state) => {
      const interval = setInterval(async ()=>{
        await axios.get(`${this.state.serviceUri}/api/system/events/member?fromBlock=${this.state.fromBlock}&toBlock=latest`)
          .then(response => {
            var memEvts = response.data
            if(memEvts.values) {
              this.setState({ memberEvents: memEvts.values.reverse() })
            }

          })
        await axios.get(`${this.state.serviceUri}/api/system/events/residence?fromBlock=${this.state.fromBlock}&toBlock=latest`)
          .then(response => {
            var addrEvts = response.data
            if(addrEvts.values) {
              this.setState({ addressEvents: addrEvts.values.reverse() })
            }
          })
        await axios.get(`${this.state.serviceUri}/api/system/events/lookup?fromBlock=${this.state.fromBlock}&toBlock=latest`)
          .then(response => {
            var lkEvts = response.data
            if(lkEvts.values) {
              this.setState({ lookupEvents: lkEvts.values.reverse() })
            }
          })
      }, 1500)
      return {
        tickInterval: interval,
        isRunning: true,
      }
    })
    this.setState(() => {
      const checking = setInterval(()=>{
        if(this.state.memberCnt < this.state.memberEvents.length) {
          this.setState({
            memberCnt: this.state.memberEvents.length,
            alertopt: {
              toggle: true,
              color: 'primary',
              message: '회원 관련 이벤트 발생이 감지되었습니다.'
            }
          },()=>{ setTimeout(() => { this.setState((state) => ({
                alertopt: {
                  ...state.alertopt,
                  toggle: false
                }}))}, 5000)
          })
        }
        if(this.state.addressCnt < this.state.addressEvents.length) {
          this.setState({
            addressCnt: this.state.addressEvents.length,
            alertopt: {
              toggle: true,
              color: 'primary',
              message: '주소 관련 이벤트 발생이 감지되었습니다.'
            }
          },()=>{ setTimeout(() => { this.setState((state) => ({
                alertopt: {
                  ...state.alertopt,
                  toggle: false
                }}))}, 5000)
          })
        }
        if(this.state.lookupCnt < this.state.lookupEvents.length) {
          this.setState({
            lookupCnt: this.state.lookupEvents.length,
            alertopt: {
              toggle: true,
              color: 'primary',
              message: '주소조회 관련 이벤트 발생이 감지되었습니다.'
            }
          },()=>{ setTimeout(() => { this.setState((state) => ({
                alertopt: {
                  ...state.alertopt,
                  toggle: false
                }}))}, 5000)
          })
        }
      }, 4000)
      return {
        checkInterval: checking
      }
    })

    //알림
    this.setState({
      alertopt: {
        toggle: true,
        color: 'success',
        message: '지금부터 이벤트 감지를 시작합니다.'
      }
    },()=>{
      setTimeout(() => {
        this.setState((state) => ({
          alertopt: {
            ...state.alertopt,
            toggle: false
          }
        }))
      }, 5000)
    })
  }

  stopListener = () => {
    this.setState((state) => {
      return {
        tickInterval: clearInterval(state.tickInterval),
        checkInterval: clearInterval(state.checkInterval),
        isRunning: false
      }
    })
    this.setState({
      alertopt: {
        toggle: true,
        color: 'danger',
        message: '이벤트 감지가 중지되었습니다.'
      }
    },()=>{
      setTimeout(() => {
        this.setState((state) => ({
          alertopt: {
            ...state.alertopt,
            toggle: false
          }
        }))
      }, 5000)
    })
  }


  render() {
    var comp;
    switch(this.state.currentTab) {
      case 'member':
        comp = this.state.memberEvents.map((element,index) => (<MemberEvent key={'member-'+index} element={element}/>))
        break;
      case 'address':
        comp = this.state.addressEvents.map((element,index) => (<AddressEvent key={'address-'+index} element={element}/>))
        break;
      case 'lookup':
        comp = this.state.lookupEvents.map((element,index) => (<LookupEvent key={'lookup-'+index} element={element}/>))
        break;
    }
    return (
      <div>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <a className="navbar-brand" href="#">LX 주소혁신 프로젝트 Event Listener</a>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav mr-auto">
              <li className={'nav-item'+this.state.currentTab==='member'?'active':''}>
                <a className="nav-link" href="javascript:void(0)" onClick={() => this.swapTabs('member')}>Member</a>
              </li>
              <li className={'nav-item'+this.state.currentTab==='address'?'active':''}>
                <a className="nav-link" href="javascript:void(0)" onClick={() => this.swapTabs('address')}>Address</a>
              </li>
              <li className={'nav-item'+this.state.currentTab==='lookup'?'active':''}>
                <a className="nav-link" href="javascript:void(0)" onClick={() => this.swapTabs('lookup')}>Lookup</a>
              </li>
            </ul>
          </div>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white">
                <span id="account">{'from: ' + this.state.fromBlock + ' admin: ' + this.state.account}
                 | 상태: <span className={this.state.isRunning?'text-success':'text-danger'}>{this.state.isRunning?'작동중':'중지'}</span>
                </span>
              </small>
            </li>
            <li>
              <button className="btn btn-primary btn-sm ml-3" onClick={this.runListener}>시작</button>
            </li>
            <li>
              <button className="btn btn-danger btn-sm ml-3" onClick={this.stopListener}>중지</button>
            </li>
          </ul>
        </nav>
        <AlertToggler options={this.state.alertopt}/>
        <div className="container-fluid mt-1">
          <h2>{this.state.tabTitle}</h2>
          <hr/>
          {/* 정보 리스트 파트 */}
          { comp }
        </div>
      </div>
    )
  }
}
export default App;