import React from 'react';

import { useOpenedRoom } from '../../../lib/RoomManager';
import RoomProvider from '../providers/RoomProvider';
import Room from './Room';

import { useMethod } from '../../../contexts/ServerContext';

const RoomWithData = () => {
	const rid = useOpenedRoom();

	if(rid){
		const readMessages = useMethod('readMessages');
		readMessages(rid);
	}


	return rid ? (
		<RoomProvider rid={rid}>
			<Room />
		</RoomProvider>
	) : null;
};

export default RoomWithData;
