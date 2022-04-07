
import { fireGlobalEvent } from './fireGlobalEvent';
import { call } from './callMethod';
import { APIClient } from '../../../utils/client';
import { doDownload } from '../../../../client/components/Message/P2P/DoDownload';

const MSG_DOWNLOAD_COMPLETE='загрузка завершена';

Meteor.p2p=Meteor.p2p||{};
Meteor.p2p_close_check=(rid:any, srcid:any)=>{
	const mp=Meteor.p2p[srcid];

	APIClient.v1.get(`rooms.info?roomId=${ rid }`).then((response)=>{
		if(response.room && response.room.usersCount){
			let counter=0;
			Object.keys(mp).forEach((k)=>{
				if(mp[k].state==='closed'){
					counter++;
				}
			});

			if(counter>=response.room.usersCount-1){
				mp.state='closed';
				setTimeout(()=>{
					call('updateMessage', {
						_id: srcid,
						msg: '     ',
						state: 'closed',
						p2p: true
					});
				}, 500);
				return true;
			}
		}
	});
}


export const processP2P=async (msg:any, autodownload:any)=>{

	if(!msg.signal){
		return;
	}
	const mp=Meteor.p2p[msg.signal.srcid];
	
	if(msg.signal.type==='announce' && msg.state!=='closed'){
		if(msg.u._id === Meteor.userId()){
			if(!mp){
				setTimeout(()=>{
					call('updateMessage', {
						_id: msg._id,
						msg: '     ',
						state: 'closed',
						p2p: true
					});
				}, 1000);
			}
		}
		else if(autodownload===true && mp===undefined && msg.filelist && msg.filelist.length){
			if(navigator.userAgent.indexOf('Electron')>-1){
				const signal=msg.signal;
				signal.autodownload=true;
				signal.rid=msg.rid;
				signal.tmid=msg.signal.tmid;
				signal.sumsize=msg.signal.sumsize;
				signal.username=msg.u.username;
				signal.filelist=msg.filelist;
				signal.randomid=Random.id();
		
				fireGlobalEvent('p2p-download', signal);
			}
			else{
				doDownload(msg, msg.signal.sumsize);
			}

			return;
		}
	}

	if(mp===undefined){
		return;
	}

   	if(msg.signal.type==='offer'){

        if(msg.u._id !== Meteor.userId() && mp.state==='announce' && mp[msg.u._id]===undefined){
			/*if(!mp.files && navigator.userAgent.indexOf('Electron')>-1){
				fireGlobalEvent('p2p-upload', {userid: msg.u._id, signal: msg.signal, rid: msg.rid, tmid: msg.tmid, randomid: Random.id()});
				return;
			}*/

			//const wrtc = require('wrtc');
			const SimplePeer=require('simple-peer');
			const peer = new SimplePeer({
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
				/*wrtc: wrtc */});
			peer.srcid=msg.signal.srcid;
			mp[msg.u._id]=peer;

			var spf:any;
			var keys:any=[];
			var transfers=new Array();
    		var _sumsend=new Array();

			const sendNextPack=()=>{
				try{
					const queue=Object.keys(transfers).length;
					for(let i=0; i<5-queue && keys.length; i++){
						var k=keys.pop();
						transfers[k]={state: 'ready'};
						peer.send("file-"+k);
					}
				}
				catch(e){
					console.log(e);
				}
			}
		
			const checkComplete=()=>{
		
				if(keys.length == 0){
					if(Object.keys(transfers).length == 0 ){ 
						peer.send("done!");
						peer.emit('DOWNLOAD_PROGRESS', 100, MSG_DOWNLOAD_COMPLETE);
					}
					else{
						
					}
				}
		
			}

			for(var i=0; i<mp.files.length; i++){
				const file=mp.files[i].file || mp.files[i];
				const fileID=mp.files[i].path+ '::' +mp.files[i].type+ '::' +mp.files[i].size;
				mp.files[fileID]=file;
				keys.push(fileID);
			}

			peer.on('signal', (data:any)=>{
				if(data.type)peer.state=data.type;
				data.srcid=peer.srcid;

				call('sendMessage', {
					_id: Random.id(),
					msg: '',
					rid: msg.rid,
					tmid: peer.srcid,
					p2p: true,
					signal: data,
					tshow: true,
					sys: true
				});
			});

			peer.signal(msg.signal);

			peer.destroy=function(){
				try{
					peer._destroy(null,()=>{})
				}
				catch(e){
					console.log('error while destroy fileChannel:', e);
				}
			}

			peer.on('connect', ()=>{
				try{
					peer.state='connected';
					var SimplePeerFiles=require('simple-peer-files-meteor');
					spf=new SimplePeerFiles.default();
					sendNextPack();
				}
				catch(e){console.log(e)}
			});

			peer.on('error', (err:any)=>{
				console.log(err);
				//peer.destroy();
				try{peer.emit('close');}catch{}
			});
		
			peer.on('close', ()=>{
				try{			
					var ok=Object.keys(transfers);
					if(ok && ok.length){
						ok.forEach((t:any)=>{
							transfers[t]=undefined;
						});
					}
					peer.destroy();
					peer.state='closed';

					Meteor.p2p_close_check(msg.rid, msg.signal.srcid);
				}
				catch{}
			});
		
			peer.on('pause', ()=>{
				if(!peer.paused){
					var ok=Object.keys(transfers);
					if(ok && ok.length){
						ok.forEach((t:any)=>{if(transfers[t])transfers[t].pause()});
					}
					peer.paused=true;
				}
			});
			peer.on('resume', ()=>{
				if(peer.paused){
					var ok=Object.keys(transfers);
					if(ok && ok.length){
						ok.forEach((t:any)=>{if(transfers[t])transfers[t].resume()});
					}
					peer.paused=false;
				}
			});
			peer.on('cancel', ()=>{
				try{
					var ok=Object.keys(transfers);
					if(ok && ok.length){
						ok.forEach((t:any)=>{if(transfers[t])transfers[t].cancel()});
					}

					setTimeout(()=>{
						peer.emit('close');
					}, 500);
				}
				catch(e){
					console.log('--peer on cancel error:', e);
				}
			});
		
			peer.on('data', async (data:any) =>{
				try{
					if (data.toString().substr(0, 6) === 'start-') {
						const fileID = data.toString().substr(6);
						if(mp.files[fileID].type==='folder'){
							try{
								delete transfers[fileID];
								sendNextPack();
								checkComplete();
							}
							catch{}
						}
						else{
							transfers[fileID] = await spf.send(peer, fileID, mp.files[fileID], /*wrtc*/);
							transfers[fileID].on('progress', (progress:any, bytes:any)=>{
								if(!progress)false;
								var p:any=0;
								_sumsend[fileID]=parseFloat(bytes);
								var ok=Object.keys(_sumsend);
								ok.forEach((k:any)=>{
									p+=Math.abs(_sumsend[k]); 
								});
								p=Number(p*100/mp.files.sumsize).toFixed(1);
								peer.emit('DOWNLOAD_PROGRESS', p, fileID);
							});
							transfers[fileID].on('done', ()=>{
								_sumsend[fileID]=mp.files[fileID].size;
								setTimeout(function(){
									try{
										delete transfers[fileID];
										sendNextPack();
										checkComplete();
									}
									catch{}
								}, 1000);
							});
							transfers[fileID].on('paused', ()=>{
								if(!peer.paused)peer.emit('pause');
							});
							transfers[fileID].on('resumed_remote', ()=>{
								setTimeout(()=>{
									try{
										if(peer.paused)peer.emit('resume');
									}
									catch{}
								}, 250);
							});
							transfers[fileID].on('cancelled', ()=>{
								try{
									if(peer.state!=='closed')peer.emit('cancel');
								}
								catch{}
							});
							transfers[fileID].start();
						}
					}
				}
				catch(e){console.log(e)}
			});
		}
	}
	else if(msg.signal.type==='answer'){

        if(msg.u._id !== Meteor.userId()){
            if(mp.state==='offer'){
                mp.state=msg.signal.type;
                if(navigator.userAgent.indexOf('Electron')>-1){
                    fireGlobalEvent('p2p-download', msg.signal);
                }
                else{
                    mp.signal(msg.signal);
                }
            }
        }
        
    }
    


}
