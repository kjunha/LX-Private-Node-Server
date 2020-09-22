import React, { Component } from 'react';

class AlertToggler extends Component {
    render() {
        if(this.props.options) {
            if(this.props.options.toggle) {
                return(
                    <div className={'alert alert-'+this.props.options.color} role="alert">
                        <p>{ this.props.options.message }</p>
                    </div>
                )
            }

        }
        return (<div></div>)
    }
}

export default AlertToggler