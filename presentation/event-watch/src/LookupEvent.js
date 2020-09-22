import React, { Component } from 'react';

class LookupEvent extends Component {
    render() {
        return(
            <div className="card mb-3">
                <div className="card-header">
                    <h3>블록번호 #{this.props.element.currentBlock}</h3>
                </div>
                <div className="card-body">
                <h5>요청타입: <span className={this.props.element.stage==='request'?'text-success':'text-primary'}>{this.props.element.stage==='request'?'사전요청':'실시간 요청'}</span></h5>
                    <ul>
                        <li>주소정보 소유주: {this.props.element.memberAddr}</li>
                        <li>주소정보 요청자: {this.props.element.requesterAddr}</li>
                        <li>요청 주소 고유키: {this.props.element.residenceNum}</li>
                    </ul>
                </div>
            </div>
        )
    }
}
export default LookupEvent;