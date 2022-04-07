/*import { Box, Modal, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, useState, memo } from 'react';

import { IUser } from '../../../definition/IUser';
import UserAutoCompleteMultiple from '../../components/UserAutoCompleteMultiple';
import { useEndpointActionExperimental } from '../../hooks/useEndpointAction';
import { goToRoomById } from '../../lib/goToRoomById';
////import { useSession } from '../../contexts/SessionContext';
import { fireGlobalEvent } from '../../../app/ui-utils/client';
////import {Rooms} from '../../../app/models';

type Username = IUser['username'];

type CreateDirectMessageProps = {
	onClose: () => void;
};

const CreateDirectP2P: FC<CreateDirectMessageProps> = ({ onClose }) => {
	const [users, setUsers] = useState<Array<Username>>([]);
	/****const currentRoomId = useSession('openedRoom');
	const room=Rooms.findOne(currentRoomId);
	let sendTo;

	if(room && room.t==='d' && room.usernames){
		const me=Meteor.user()?.username;
		sendTo=room.usernames.filter((u:any)=>u!=me);

		if(sendTo){
			console.log('users:', users);
			if(!users.includes(sendTo[0])){
				setUsers([...users, sendTo[0]])
			}
		}
	}****/
	/*const createDirect = useEndpointActionExperimental('POST', 'dm.create');

	const onChangeUsers = useMutableCallback((value: Username, action: string) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return setUsers([...users, value]);
		}
		setUsers(users.filter((current) => current !== value));
	});

	const onCreate = useMutableCallback(async () => {
		try {
			const {
				room: { rid },
			} = await createDirect({ usernames: users.join(',') });

			goToRoomById(rid).then(()=>{
				fireGlobalEvent('p2p-upload', {room: {rid:rid}, randomid: Random.id()});
			});
			onClose();
		} catch (error) {
			console.warn(error);
		}
	});

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>Отправка файлов</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box>Вы собираетесь отправить файлы одному или нескольким пользователям. Укажите в поле ниже тех, кому нужно передать ваши файлы.</Box>
				<Box mbs='x16' display='flex' flexDirection='column' width='full'>
					<UserAutoCompleteMultiple value={users} onChange={onChangeUsers} />
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>Отмена</Button>
					<Button disabled={users.length < 1} onClick={onCreate} primary>Отправить</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default memo(CreateDirectP2P);*/
