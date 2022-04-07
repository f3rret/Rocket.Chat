import { call } from '../../../../app/ui-utils/client';
import { fileSave } from 'browser-fs-access';

const MSG_DOWNLOAD_COMPLETE='загрузка завершена';
const MSG_DOWNLOAD_BEGIN='идет загрузка..';

export const doDownload=(msg, sumsize)=>{

    const signal=msg.signal;
    //const wrtc = require('wrtc');
    const SimplePeer=require('simple-peer');
    const peer = new SimplePeer({
        initiator: true,
        //reconnectTimer: 100,
        iceTransportPolicy: 'relay',
        trickle: false,
        config: {
            iceServers: [
                {
                    urls: ['stun:192.168.0.77:3478', 'turn:192.168.0.77:3478'],
                    username: 'rocketchat',
                    credential: 'rocketchat'
                }
            ]
        },
        /*wrtc: wrtc*/ });
    peer.destroy=function(){
        try{
            peer._destroy(null, ()=>{})
        }
        catch(e){
            console.log('error while destroy fileChannel:', e);
        }
    }

    const offerMsgId=Random.id();
    peer.on('signal', (data)=>{
        if(data.type){
            peer.state=data.type;
        }

        if(data.type && data.type==='offer'){
            peer.srcid=signal.srcid;
            data.srcid=peer.srcid;

            call('sendMessage', {
                _id: offerMsgId,
                msg: MSG_DOWNLOAD_BEGIN,
                rid: signal.rid,
                tmid: peer.srcid,
                p2p: true,
                signal: data,
                tshow: true
            });

            Meteor.p2p=Meteor.p2p||{};
            Meteor.p2p[peer.srcid]=peer;
        }
    });

    const SimplePeerFiles=require('simple-peer-files-meteor');
    var spf=new SimplePeerFiles.default();
    var transfers=new Array();
    var _sumrec=new Array();


    var checkInterval=null;
    var checkIntervalCounter=0;

    const checkComplete=()=>{
        if(checkInterval)return;

        checkInterval=setInterval(function(){
            var ok=Object.keys(transfers);
            if(ok && ok.length && checkIntervalCounter<5){
                checkIntervalCounter++;
                return;
            }
            clearInterval(checkInterval);

            peer.emit('DOWNLOAD_PROGRESS', 100, MSG_DOWNLOAD_COMPLETE);
            peer.emit('close');
        }, 1000);
    }

    peer.on('error', (err)=>{
        console.log(err);
        //peer.destroy();
    });

    peer.on('connect', ()=>{
        peer.state='connected';
    });

    peer.on('close', ()=>{
       
        try{
            if(checkInterval)clearInterval(checkInterval);
            
            if(peer.state==='closed')return;
            peer.state='closed';

            var ok=Object.keys(transfers);
            if(ok && ok.length){
                ok.forEach((t)=>transfers[t]=undefined);
            }

            peer.destroy();

            call('updateMessage', {
                _id: offerMsgId,
                msg: MSG_DOWNLOAD_COMPLETE,
                rid: msg.signal.rid,
                tmid: peer.srcid,
                state: 'closed',
                p2p: true
            });
        }
        catch(e){
            console.log(e);
        }

    });

    peer.on('pause', ()=>{
        if(!peer.paused){
            var ok=Object.keys(transfers);
            if(ok && ok.length){
                ok.forEach((t)=>transfers[t].pause());
            }
            peer.paused=true;
        }
    });
    peer.on('resume', ()=>{
        if(peer.paused){
            var ok=Object.keys(transfers);
            if(ok && ok.length){
                ok.forEach((t)=>transfers[t].resume());
            }
            peer.paused=false;
        }
    });
    peer.on('cancel', ()=>{
        try{
            var ok=Object.keys(transfers);
            if(ok && ok.length){
                ok.forEach((t)=>{transfers[t].cancel();});
            }
            peer.emit('close');
        }
        catch(e){
            console.log('---peer on cancel error:', e);
        }
    });

    peer.on('data', (data) =>{
        try{
            if (data.toString().substr(0, 5) === 'file-') {
                const fileID = data.toString().substr(5);

                spf.receive(peer, fileID/*, wrtc*/).then((t) => {
                    transfers[fileID]=t;
                    transfers[fileID].on('progress', (progress, bytes)=>{
                        _sumrec[fileID]=bytes;
                        var p=0;
                        var ok=Object.keys(_sumrec);
                        ok.forEach((k)=>{
                            p+=Math.abs(_sumrec[k]); 
                        });
                        p=Number(p*100/sumsize).toFixed(1);
                        peer.emit('DOWNLOAD_PROGRESS', p, fileID);
                    });
                    transfers[fileID].on('done', (file)=>{
                        _sumrec[fileID]=file.size;
                        var binaryData = [];
                        binaryData.push(file);
                        var blob=new Blob(binaryData, {type: file.type});
                        
                        fileSave(blob, {fileName: file.name}).then(()=>{
                            binaryData=[]; //обязательно скинуть буферы
                            blob=null;
                        });

                        setTimeout(function(){
                            delete transfers[fileID];
                        }, 1000);
                    });
                    transfers[fileID].on('paused', ()=>{
                        if(!peer.paused)peer.emit('pause');
                    });
                    transfers[fileID].on('resumed', ()=>{
                        if(peer.paused)peer.emit('resume');
                    });
                    transfers[fileID].on('cancelled', ()=>{
                        if(peer.state!=='closed')peer.emit('cancel');
                    });
                });
                peer.send('start-' + fileID);
            }
            else if(data.toString()=='done!'){
                checkComplete();
            }
        }
        catch(e){
            console.log(e);
        }
    });

}