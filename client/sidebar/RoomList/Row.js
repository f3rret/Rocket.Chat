import { Sidebar } from '@rocket.chat/fuselage';
import React, { memo, useCallback } from 'react';

import Omnichannel from '../sections/Omnichannel';
import SideBarItemTemplateWithData from './SideBarItemTemplateWithData';

import { useRoute } from '../../contexts/RouterContext';
import { ReactiveUserStatus } from '../../components/UserStatus';

const sections = {
	Omnichannel,
};

const Row = ({ data, item }) => {
	const { extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode } = data;

	if (typeof item === 'string') {
		const Section = sections[item];
		return Section ? (
			<Section aria-level='1' />
		) : (
			<Sidebar.Section.Title aria-level='1'>{t(item)}</Sidebar.Section.Title>
		);
	}

	const directRoute = useRoute('direct');
	item_onclick=useCallback(
		(username) => (e) => {
			e.preventDefault();

			if (e.type === 'click' || e.key === 'Enter') {
				directRoute.push({ rid: username });
			}
		},
		[directRoute],
	);

	if (item.username) {
		const icon = (
			<Sidebar.Item.Icon>
				<ReactiveUserStatus uid={item._id} />
			</Sidebar.Item.Icon>
		);

		return <SideBarItemTemplate
			title={item.name}
			phone={item.phone}
			aria-label={item.name}
			is='a'
			id={item._id}
			data-qa='sidebar-item'
			aria-level='2'
			selected={false}
			onClick={item_onclick(item.username)}
			href='#'
			icon={icon}
		/>
	}

	return (
		<SideBarItemTemplateWithData
			sidebarViewMode={sidebarViewMode}
			selected={item.rid === openedRoom}
			t={t}
			room={item}
			extended={extended}
			SideBarItemTemplate={SideBarItemTemplate}
			AvatarTemplate={AvatarTemplate}
		/>
	);
};

export default memo(Row);
