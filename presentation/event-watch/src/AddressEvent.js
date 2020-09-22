import React, { Component } from 'react';

class AddressEvent extends Component {
    render() {
        var state;
        var stateText;
        if(this.props.element.alive) {
            if(this.props.element.previousBlock === 0) {
                state = 'created'
                stateText = '생성'
            } else {
                state = 'updated'
                stateText = '변경'
            }
        } else {
            state = 'deleted'
            stateText = '삭제'
        }
        return(
            <div className="card mb-3">
                <div className="card-header">
                    <h3>블록번호 #{this.props.element.currentBlock}</h3>
                </div>
                <div className="card-body">
                    <h5>상태: <span className={state==='deleted'?'text-danger':'text-success'}>{stateText}</span></h5>
                    <ul>
                        <li>회원 블록체인 주소: {this.props.element.memberAddr}</li>
                        <li>주소 고유키: {this.props.element.residenceNum}</li>
                        <li>안심 주소: {this.props.element.myGeonick}</li>
                        <li>GS1 코드: {this.props.element.gs1}</li>
                        <li>도로명 주소: {this.props.element.streetAddr}</li>
                        <li>지번 주소: {this.props.element.gridAddr}</li>
                        <li>이전 블록번호: {this.props.element.previousBlock}</li>
                    </ul>
                </div>
            </div>
        )
    }
}
export default AddressEvent;