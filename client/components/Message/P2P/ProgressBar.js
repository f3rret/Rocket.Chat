import React from 'react';
import { Line } from 'rc-progress';
import { Icon, Box, Button } from '@rocket.chat/fuselage';
import { fireGlobalEvent } from '../../../../app/ui-utils/client';

const MSG_DOWNLOAD_CANCEL='Загрузка отменена';

class ProgressBar extends React.Component {
    constructor(props){
        super(props);
        this.state={
            currfilename: '',
            progress: 0,
            peerid: '',
            paused: false,
            sumsize: 0,
            userid: ''
        };
    }

    tickID=null;
    peer=null;
    tickMark=Date.now();

    tick(){
        this.peer=Meteor.p2p[this.props.peerid][this.props.userid] || Meteor.p2p[this.props.peerid];
        if(this.peer){
            if(this.peer.paused===true){
                this.setState({paused: true});
            }
            else if(this.peer.currfilename){ 
                const fileinfo=this.peer.currfilename.split('::');
                this.setState({paused: false, progress: parseFloat(this.peer.progress).toFixed(1), currfilename: fileinfo.length>1?
                    fileinfo[0]+" "+fileinfo[1]+" "+(parseFloat(fileinfo[2])/(1024*1024)).toPrecision(4)+" Мб":fileinfo});
            }
        }
        if(!this.peer || this.peer.state==='closed'){
            setTimeout(()=>clearInterval(this.tickID), 250);
        }
    }

    componentDidMount(){
        this.peer=Meteor.p2p[this.props.peerid][this.props.userid] || Meteor.p2p[this.props.peerid];

        if(navigator.userAgent.indexOf('Electron')>-1 && (!this.peer || !this.peer.config)){
            this.tickID=setInterval(()=>this.tick(), 250);
        }
        else{
            this.peer.on('DOWNLOAD_PROGRESS', (p, f)=>{
                if(Date.now()-this.tickMark>250){
                    const fileinfo=f.split('::');
                    if(p>100){p=100;}
                    this.setState({progress: parseFloat(p).toFixed(1), currfilename: fileinfo.length>1?
                        fileinfo[0]+" "+fileinfo[1]+" "+(parseFloat(fileinfo[2])/(1024*1024)).toPrecision(4)+" Мб":fileinfo});
                
                    this.tickMark=Date.now();
                }
            });
            this.peer.on('pause', ()=>{
                this.setState({paused: true});
            });
            this.peer.on('resume', ()=>{
                this.setState({paused: false});
            });
            /*this.peer.on('cancel', ()=>{
                this.setState({currfilename: MSG_DOWNLOAD_CANCEL});
            });*/
        }
    }
    componentWillUnmount(){
        clearInterval(this.tickID);
    }

    handlePause=()=>{
        this.peer=Meteor.p2p[this.props.peerid][this.props.userid] || Meteor.p2p[this.props.peerid];
        if(navigator.userAgent.indexOf('Electron')>-1 && (!this.peer || !this.peer.config)){
            fireGlobalEvent('p2p-download', {pause: true, srcid: this.props.peerid, userid: this.props.userid});
        }
        else{
            this.peer.emit('pause');
        }
    };
    handleResume=()=>{
        this.peer=Meteor.p2p[this.props.peerid][this.props.userid] || Meteor.p2p[this.props.peerid];
        if(navigator.userAgent.indexOf('Electron')>-1 && (!this.peer || !this.peer.config)){
            fireGlobalEvent('p2p-download', {resume: true, srcid: this.props.peerid, userid: this.props.userid});
        }
        else{
            this.peer.emit('resume');
        }
    };
    handleCancel=()=>{
        this.peer=Meteor.p2p[this.props.peerid][this.props.userid] || Meteor.p2p[this.props.peerid];
        if(navigator.userAgent.indexOf('Electron')>-1 && (!this.peer || !this.peer.config)){
            fireGlobalEvent('p2p-download', {cancel: true, srcid: this.props.peerid, userid: this.props.userid});
        }
        else{
            this.peer.emit('cancel'); 
        }
    };

    render(){
        return(
            <>
            <Box display='flex' style={{flexWrap: 'nowrap', justifyContent:'space-between', alignContent: 'space-between'}}>
            <Box display='flex'>{this.state.progress} % {this.state.currfilename}</Box>
            <Box display='flex'>
                {!this.state.paused && <Icon name='pause' style={{fontSize: '150%', cursor: 'pointer'}} title='Пауза' onClick={this.handlePause}/>}
                {this.state.paused && <Icon name='play' style={{fontSize: '150%', cursor: 'pointer'}} title='Продолжить' onClick={this.handleResume}/>}
                &nbsp;
                <Icon name='cancel' title='Отмена' style={{fontSize: '150%', cursor: 'pointer'}} onClick={this.handleCancel}/>
            </Box>
            </Box>
            <Line percent={this.state.progress}/>            
            </>
        );
    }
}

export default ProgressBar;