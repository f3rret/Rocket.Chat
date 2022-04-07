import React from 'react';

import { Button } from '@rocket.chat/fuselage';
import { fireGlobalEvent } from '../../../../app/ui-utils/client';
import { call } from '../../../../app/ui-utils/client';
import { ChatSubscription } from '../../../../app/models'
import { doDownload } from './DoDownload'

class DownloadButton extends React.Component{

    constructor(props){
        super(props);
        this.state={
            enabled: true,
            msg: null,
            sumsize: 0,
            awaitig: false,
            autoDownload: false
        }
    }

    componentDidMount(){
        
        try{
            if(this.state.enabled && this.props.msg.u._id !== Meteor.userId() && this.props.msg.state!=='closed'){
                const subscription = ChatSubscription.findOne({rid: this.props.msg.rid, 'u._id': Meteor.userId()});
                
                if(subscription.autoDownloadP2P===true){
                   this.setState({enabled: false, autoDownload: true});
                }
            }

            if(this.state.enabled && this.props.msg.u._id === Meteor.userId() && this.props.msg.state!=='closed'){
                const _this=this;
                setTimeout(function(){
                    try{
                        const p=Meteor.p2p[_this.props.msg.signal.srcid];

                        if(Object.keys(p).length<3){
                            call('updateMessage', {
                                _id: _this.props.msg._id,
                                msg: 'передача файлов отменена по таймауту',
                                state: 'closed',
                                p2p: true
                            });
                        }
                    }
                    catch(e){
                        console.log(e);
                    }
                }, 300000);
            }
        }
        catch(e){
            console.log(e);
        }
        
    }

    componentWillUnmount(){}

    onDownloadClick = () => {

        const msg=this.props.msg;
        const signal=msg.signal;
            
        if(navigator.userAgent.indexOf('Electron')>-1){
            signal.rid=msg.rid;
            signal.tmid=signal.srcid;
            signal.username=msg.u.username;
            signal.sumsize=this.props.sumsize;
            signal.filelist=msg.filelist;
            signal.randomid=Random.id();

            fireGlobalEvent('p2p-download', signal);
            this.setState({enabled: false, awaiting: true});

            const _this=this;
            _this.interval=setInterval(function(){
                if(_this && Meteor.p2p[signal.srcid]/* && Meteor.p2p[signal.srcid].state!=='closed'*/){
                    clearInterval(_this.interval);

                    if(Meteor.p2p[signal.srcid].state==='cancelled'){
                        _this.setState({enabled: true, awaiting: false});
                    }
                    else{
                        _this.setState({awaiting: false});
                    }
                }
            }, 5000);

            return;
        }

        if(Meteor.p2p[signal.srcid] && Meteor.p2p[signal.srcid].state==='closed') return;
        
        doDownload(msg, this.props.sumsize);

        this.setState({enabled: false, awaiting: true});

        const _this=this;
        setTimeout(function(){
            if(_this)_this.setState({awaiting: false});
        }, 5000);
    };

    onCancelClick = () => {

        try{
            const msg=this.props.msg;
            const signal=msg.signal;

            call('updateMessage', {
                _id: msg._id,
                msg: 'передача файлов отменена отправителем',
                state: 'closed',
                p2p: true
            });
        
            if(Meteor.p2p[signal.srcid]){
                Meteor.p2p[signal.srcid].state='closed';

                const ok=Object.keys(Meteor.p2p[signal.srcid]);
                ok.forEach(k=>{
                    if(Meteor.p2p[signal.srcid][k].state && Meteor.p2p[signal.srcid][k].state!=='closed'){
                        Meteor.p2p[signal.srcid][k].emit('close', 'передача файлов отменена отправителем');
                    }
                });
            }

            /*if(navigator.userAgent.indexOf('Electron')>-1){
                signal.type='close';
                fireGlobalEvent('p2p-upload', {signal: signal});
                this.setState({enabled: false});
                return;
            }*/

        }
        catch(e){console.log(e)}

        this.setState({enabled: false});
    };

    render(){
        return (
            <>
            {this.state.enabled && this.props.msg.u._id !== Meteor.userId() && this.props.msg.state!=='closed' &&
				<Button onClick={this.onDownloadClick} style={{marginTop: '10px'}} primary>
					Загрузить
				</Button>}
            {this.state.enabled && this.props.msg.u._id === Meteor.userId() &&
                 <Button onClick={this.onCancelClick} style={{marginTop: '10px'}} primary>
                    Отменить
                </Button>}
            {this.state.awaiting && this.props.msg.state!=='closed' &&
                <>
                    <i className='icon-spin animate-spin loading-icon'></i> 
                     соединение...
                </>
            }
            {this.state.autoDownload &&
                <>
                    <i className='icon-star'></i>
                    Включен режим автоприема 
                </>
            }
            </>
        );
    }

}

export default DownloadButton;