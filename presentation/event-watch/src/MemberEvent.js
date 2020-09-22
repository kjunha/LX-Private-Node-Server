import React, { Component } from 'react';

class MemberEvent extends Component {
    render() {
        return(
            <div className="card mb-3">
                <div className="card-header">
                    <h3>블록번호 #{this.props.element.currentBlock}</h3>
                </div>
                <div className="card-body">
                <h5>상태: <span className={this.props.element.stage==='register'?'text-success':'text-danger'}>{this.props.element.stage==='register'?'생성':'삭제'}</span></h5>
                    <ul>
                        <li>회원 블록체인 주소: {this.props.element.memberAddr}</li>
                        <li>회원 고유키: {this.props.element.primaryKey}</li>
                    </ul>
                </div>
            </div>
        )
    }
}
export default MemberEvent;