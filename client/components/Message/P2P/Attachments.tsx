import React, { FC } from 'react';

import { Box, Icon } from '@rocket.chat/fuselage';
import DownloadButton from './DownloadButton';
import ProgressBar from './ProgressBar';

import { useBlockRendered } from '../hooks/useBlockRendered';

const Attachments: FC<{ msg: any }> = ({msg = null}): any => {
	const { className, ref } = useBlockRendered();
	const showmore=(e:any)=>{
		let prev=e.target.previousSibling;
				
		while(prev && prev.style.display==='none'){
			prev.style.display='';
			prev=prev.previousSibling;
		}

		e.target.style.display='none';
	}

	if(msg && msg.signal){
		const mp=Meteor.p2p[msg.signal.srcid];
		const _sumsize=msg.signal.sumsize;
		const sumsizeStr=Number(_sumsize/(1024*1024)).toFixed(3);

		if(msg.signal.type==='announce'){
			const boxStyle={display: 'flex', margin: '4px 0', opacity: '1'};
			if(msg.state==='closed')boxStyle.opacity='0.5';

			if(msg.filelist && msg.filelist.length){
				return (
					<Box style={{padding: '5px', marginTop: '10px', marginRight: '10px'}}>
						<div className={className} ref={ref as any} />
					
						{msg.filelist.map((f:any, index:any) => (
								<Box key={index} style={index<3?{}:{display:'none'}}><Icon name={f.type==='folder'?'folder':'file'} size={20} style={{marginTop:'-3px'}}/>{f.name} </Box>
							))}
						{msg.filelist.length>3 && <Box onClick={showmore} color='neutral-600' style={{cursor: 'pointer'}}>&nbsp;... еще {msg.filelist.length-3} элементов</Box>}
						<Box style={boxStyle}><Icon name='download' size={20}/>&nbsp;{sumsizeStr} Мб</Box>
						
						{msg.state!=='closed' && <DownloadButton msg={msg} enabled={true} sumsize={_sumsize}/>}
					</Box>
				);
			}
		}
		else if(msg.signal.type==='offer' && msg.state!=='closed' && mp!==undefined){

			if(['answer', 'connected', 'announce'].indexOf(mp.state)>-1){
				if( (msg.u._id === Meteor.userId()) ||
					(msg.u._id !== Meteor.userId() && mp[msg.u._id]) ){

					return (
						<>
						<div className={className} ref={ref as any} />
						<ProgressBar peerid={msg.signal.srcid} userid={msg.u._id} sumsize={_sumsize}/>
						</>
					);
				}
			}
		}
	}

	return (<>
			<div className={className} ref={ref as any} />
			</>);
};

export default Attachments;
