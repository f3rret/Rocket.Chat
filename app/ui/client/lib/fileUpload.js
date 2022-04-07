import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

import { settings } from '../../../settings/client';
import { fileUploadIsValidContentType, APIClient } from '../../../utils';
import { prependReplies } from '../../../ui-utils';

/*import { imperativeModal } from '../../../../client/lib/imperativeModal';
import FileUploadModal from '../../../../client/components/modals/FileUploadModal';*/

import { //p2p
	messageProperties,
	MessageTypes,
	readMessage,
	modal,
	call
} from '../../../../app/ui-utils/client';
import { keys } from 'localforage';
//const MSG_DOWNLOAD_COMPLETE='Загрузка завершена';

export const uploadFileWithMessage = async (rid, tmid, { description, fileName, msg, file }) => {
	const data = new FormData();
	description	&& data.append('description', description);
	msg	&& data.append('msg', msg);
	tmid && data.append('tmid', tmid);
	data.append('file', file.file, fileName || file.name);

	const uploads = Session.get('uploading') || [];

	const upload = {
		id: Random.id(),
		name: fileName,
		percentage: 0,
	};

	uploads.push(upload);
	Session.set('uploading', uploads);

	const { xhr, promise } = APIClient.upload(`v1/rooms.upload/${ rid }`, {}, data, {
		progress(progress) {
			const uploads = Session.get('uploading') || [];

			if (progress === 100) {
				return;
			}
			uploads.filter((u) => u.id === upload.id).forEach((u) => {
				u.percentage = Math.round(progress) || 0;
			});
			Session.set('uploading', uploads);
		},
		error(error) {
			const uploads = Session.get('uploading') || [];
			uploads.filter((u) => u.id === upload.id).forEach((u) => {
				u.error = error.message;
				u.percentage = 0;
			});
			Session.set('uploading', uploads);
		},
	});

	Tracker.autorun((computation) => {
		const isCanceling = Session.get(`uploading-cancel-${ upload.id }`);
		if (!isCanceling) {
			return;
		}
		computation.stop();
		Session.delete(`uploading-cancel-${ upload.id }`);

		xhr.abort();

		const uploads = Session.get('uploading') || {};
		Session.set('uploading', uploads.filter((u) => u.id !== upload.id));
	});

	try {
		await promise;
		const uploads = Session.get('uploading') || [];
		return Session.set('uploading', uploads.filter((u) => u.id !== upload.id));
	} catch (error) {
		const uploads = Session.get('uploading') || [];
		uploads.filter((u) => u.id === upload.id).forEach((u) => {
			u.error = (error.xhr && error.xhr.responseJSON && error.xhr.responseJSON.error) || error.message;
			u.percentage = 0;
		});
		Session.set('uploading', uploads);
	}
};

export const fileUploadP2P = async (files, input, { rid, tmid }) => {

	const folders=[];
	const toplevel=[];

	files.forEach((f)=>{
		if(f.path.indexOf("/")>-1){
			const fname=f.path.substr(0, f.path.indexOf("/"));
			if(!folders[fname]){
				folders[fname]={type: 'folder', name: fname, path: fname+'/', relpath: fname+'/', size: f.size};
				toplevel.push(folders[fname]);
			}
			else{
				folders[fname].size+=f.size;
			}
		}
		else{
			toplevel.push(f);
		}
	});
	/*summ=summ.filter((s)=>{
		return s && s.relpath && s.relpath.indexOf('/')===-1;
	});*/

	const peerid=Random.id();
	call('sendMessage', {
		_id: peerid,
		msg: '',
		rid: rid,
		tmid: tmid,
		p2p: true,
		filelist: toplevel,
		signal: {type: 'announce', srcid: peerid, rid: rid, tmid: tmid, sumsize: files.sumsize}
	});

	Meteor.p2p=Meteor.p2p||{};
	Object.keys(folders).forEach(k=>{
		files.push(folders[k]);
	});
	Meteor.p2p[peerid]={state: 'announce', files: files};
	
	return;
	
};

export const fileUpload = async (files, input, { rid, tmid }, forceZip) => {

	const zipinfo = {
		id: Random.id(),
		name: 'Сжатие файлов...',
		totalsize: 0
	};

	const tryP2Pdialog=()=>{
		modal.open({
			title: 'Отправка файлов',
			text: 'Файлы слишком большие, чтобы прикрепить их к беседе. Вы хотите передать их напрямую получателям через P2P?',
			showCancelButton: true,
			confirmButtonText: 'Передать P2P',
			cancelButtonText: TAPi18n.__('Cancel'),
			closeOnConfirm: true,
			html: false,
		}, (inputValue) => {
			if (inputValue === false) {
				return false;
			}

			var sumsize=0;
			
			files.forEach((entry) => {
				sumsize+=entry.file.size;

				let path=entry.path;
				if(path.startsWith('/'))path=path.slice(1);

				entry.relpath=entry.file.name;
				entry.path=path;
				entry.type=entry.file.type;
				entry.size=entry.file.size;
			});
			files.sumsize=sumsize;
			fileUploadP2P(files, input, {rid, tmid});
		});

		return;

		/*try{
			$('.js-action-menu').click();
			const p2pmenu=$('.rc-popover__list > li[data-id="file-upload-p2p"]').parent();
			p2pmenu.css({'background-color':'moccasin'});
			const anim=(count)=>{
				p2pmenu.animate({opacity: 0.3}, 1000, ()=>{
					p2pmenu.animate({opacity: 1}, 1000, ()=>{
						if(count<3){anim(count+1);}
						else{p2pmenu.css({'background-color':'rgba(0,0,0,0)'});}
					});
				});
			}
			anim(0);
		}
		catch(e){
			console.log(e);
			return;
		}*/
	}

	const MAX_FILESIZE_ERROR='Превышен максимальный размер (80Мб). Воспользуйтесь отправкой файлов P2P.';
	const threadsEnabled = settings.get('Threads_enabled');

	var totalsize=0;
	for(let i=0; i<files.length; i++){
		totalsize+=files[i].file.size;
	}
	if(totalsize>80000000){
		//zipinfo.error=MAX_FILESIZE_ERROR;
		//Session.set('zipping', zipinfo);
		//files=undefined;
		return tryP2Pdialog();
	}

	if(files.length > 3 || forceZip){
		Session.set('zipping', zipinfo);

		var JSZip = require("jszip");
		var zip = new JSZip();
		totalsize=0;

		try{
			for(let i=0; i<files.length; i++){

				let entryName=files[i].path || files[i].name;
				if(entryName.startsWith("/")){
					entryName=entryName.slice(1);
				}

				zip.file(entryName, files[i].file, { createFolders: true });
				totalsize+=files[i].file.size;
				zipinfo.totalsize=parseFloat(totalsize/(1024*1024)).toFixed(3)+' Мб';
				Session.set('zipping', zipinfo);
				
				//if(totalsize > 900000000){
					//zipinfo.error=MAX_FILESIZE_ERROR;
				//	zip=undefined;
					//files=undefined;
				//	Session.set('zipping', []);
				//	return tryP2Pdialog();
					//return Session.set('zipping', zipinfo);
				//}
			}

			await zip.generateAsync({type:'blob'}).then((blob)=>{
				files=[{
					file: blob,
					name: (forceZip || files[0].name).substring(0, 30) + ' (' + files.length + ' файлов).zip'
				}];
			});

			Session.set('zipping', []);
		}
		catch(e){
			zip=undefined;
			files=undefined;
			zipinfo.error='Ошибка сжатия';
			return;
		}

	}
	else{
		files = [].concat(files);
	}

	const replies = $(input).data('reply') || [];
	const mention = $(input).data('mention-user') || false;

	let msg = '';

	if (!mention || !threadsEnabled) {
		msg = await prependReplies('', replies, mention);
	}

	if (mention && threadsEnabled && replies.length) {
		tmid = replies[0]._id;
	}

	const uploadNextFile = () => {
		const file = files.pop();
		if (!file) {
			return;
		}

		uploadFileWithMessage(rid, tmid, {
			undefined,
			undefined,
			undefined,
			file,
		});
		
		uploadNextFile();

		/*imperativeModal.open({
			component: FileUploadModal,
			props: {
				file: file.file,
				onClose: () => {
					imperativeModal.close();
					uploadNextFile();
				},
				onSubmit: (fileName, description) => {
					uploadFileWithMessage(rid, tmid, {
						description,
						fileName,
						msg: msg || undefined,
						file,
					});
					imperativeModal.close();
					uploadNextFile();
				},
				isValidContentType: file.file.type && fileUploadIsValidContentType(file.file.type),
			},
		});*/
	};

	uploadNextFile();
};
