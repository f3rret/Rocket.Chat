import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import { useEffect } from 'react';

import { IRoom } from '../../../definition/IRoom';
import { ISubscription } from '../../../definition/ISubscription';
import { useQueuedInquiries, useOmnichannelEnabled } from '../../contexts/OmnichannelContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useUserPreference, useUserSubscriptions } from '../../contexts/UserContext';
import { useQueryOptions } from './useQueryOptions';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useQuery } from '../../views/directory/hooks';

const query = { open: { $ne: false } };

const emptyQueue: IRoom[] = [];

export const useRoomList = (): Array<ISubscription> => {
	const [roomList, setRoomList] = useDebouncedState<ISubscription[]>([], 150);

	const showOmnichannel = useOmnichannelEnabled();
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const options = useQueryOptions();

	const rooms = useUserSubscriptions(query, options);

	const inquiries = useQueuedInquiries();

	let queue: IRoom[] = emptyQueue;
	if (inquiries.enabled) {
		queue = inquiries.queue;
	}

	const params = { current: 0, itemsPerPage: 200 };
	const sort = ['name', 'asc'];
	const catquery=useQuery(params, sort, 'users', 'local');
	const { value: catdata = {} } = useEndpointData('directory', catquery);

	useEffect(() => {
		setRoomList(() => {
			const favorite = new Set();
			const team = new Set();
			const omnichannel = new Set();
			const unread = new Set();
			const channels = new Set();
			const direct = new Set();
			const discussion = new Set();
			const conversation = new Set();
			const onHold = new Set();
			const catalog = new Set();
			const directNames=[];

			rooms.forEach((room) => {
				if (sidebarShowUnread && (room.alert || room.unread) && !room.hideUnreadStatus) {
					return unread.add(room);
				}

				if (favoritesEnabled && room.f) {
					if(room.name)directNames.push(room.name);
					return favorite.add(room);
				}

				if (room.teamMain) {
					return team.add(room);
				}

				if (sidebarGroupByType && isDiscussionEnabled && room.prid) {
					return discussion.add(room);
				}

				if (room.t === 'c' || room.t === 'p') {
					channels.add(room);
				}

				if (room.t === 'l' && room.onHold) {
					return showOmnichannel && onHold.add(room);
				}

				if (room.t === 'l') {
					return showOmnichannel && omnichannel.add(room);
				}

				if (room.t === 'd') {
					direct.add(room);
					if(room.name)directNames.push(room.name);
				}

				conversation.add(room);
			});
////

			const disabled=['gm', 'rocket.cat', 'hunter', 'poll.bot'];
			const cr=catdata.result;

			cr && cr.forEach((el:any)=>{
				if(el.username && disabled.indexOf(el.username)==-1 && directNames.indexOf(el.username)==-1){
					catalog.add(el);
				}
			});
////
			const groups = new Map();
			showOmnichannel && groups.set('Omnichannel', []);
			showOmnichannel &&
				inquiries.enabled &&
				queue.length &&
				groups.set('Incoming_Livechats', queue);
			showOmnichannel && omnichannel.size && groups.set('Open_Livechats', omnichannel);
			showOmnichannel && onHold.size && groups.set('On_Hold_Chats', onHold);
			sidebarShowUnread && unread.size && groups.set('Unread', unread);
			favoritesEnabled && favorite.size && groups.set('Favorites', favorite);
			team.size && groups.set('Teams', team);
			sidebarGroupByType &&
				isDiscussionEnabled &&
				discussion.size &&
				groups.set('Discussions', discussion);
			sidebarGroupByType && channels.size && groups.set('Channels', channels);
			sidebarGroupByType && direct.size && groups.set('Direct_Messages', direct);
			!sidebarGroupByType && groups.set('Conversations', conversation);
			catalog.size && groups.set('Новые пользователи', catalog);
			return [...groups.entries()].flatMap(([key, group]) => [key, ...group]);
		});
	}, [
		rooms,
		showOmnichannel,
		inquiries.enabled,
		queue,
		sidebarShowUnread,
		favoritesEnabled,
		sidebarGroupByType,
		setRoomList,
		isDiscussionEnabled,
	]);

	return roomList;
};
