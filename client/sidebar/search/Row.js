import React, { memo } from 'react';

import SideBarItemTemplateWithData from '../RoomList/SideBarItemTemplateWithData';
import UserItem from './UserItem';

const Row = ({ item, data }) => {
	const { t, SideBarItemTemplate, avatarTemplate: AvatarTemplate, showRealName, extended } = data;

	if (item.t === 'd' && !item.u) {
		return (
			<UserItem
				id={`search-${item._id}`}
				useRealName={showRealName}
				t={t}
				item={item}
				SideBarItemTemplate={SideBarItemTemplate}
				AvatarTemplate={AvatarTemplate}
			/>
		);
	}
	return (
		<SideBarItemTemplateWithData
			id={`search-${item._id}`}
			tabIndex={-1}
			extended={extended}
			t={t}
			room={item}
			SideBarItemTemplate={SideBarItemTemplate}
			AvatarTemplate={AvatarTemplate}
		/>
	);
};

export default memo(Row);
