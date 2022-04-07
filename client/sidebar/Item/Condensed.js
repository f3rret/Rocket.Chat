import { Sidebar, ActionButton } from '@rocket.chat/fuselage';
import { useMutableCallback, usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import React, { memo, useState } from 'react';

const Condensed = ({
	icon,
	title = '',
	phone,
	titleIcon,
	avatar,
	actions,
	href,
	menuOptions,
	unread,
	menu,
	badges,
	selected,
	threadUnread,
	...props
}) => {
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);

	const isReduceMotionEnabled = usePrefersReducedMotion();

	const handleMenu = useMutableCallback((e) => {
		setMenuVisibility(e.target.offsetWidth > 0 && Boolean(menu));
	});
	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: handleMenu,
	};

	return (
		<Sidebar.Item {...props} href={href} clickable={!!href} style={{paddingRight: 5}}>
			{avatar && <Sidebar.Item.Avatar>{avatar}</Sidebar.Item.Avatar>}
			<Sidebar.Item.Content>
				<Sidebar.Item.Wrapper>
					{icon}
					<Sidebar.Item.Title
						data-qa='sidebar-item-title'
						className={unread && 'rcx-sidebar-item--highlighted'}
					>
						{title}
						{phone && <b style={{position: 'absolute', right: '35px', fontSize: '85%', color: 'tan', opacity: '0.75'}} className="icon-phone-squared">{phone}</b>}
					</Sidebar.Item.Title>
				</Sidebar.Item.Wrapper>
				{badges && <Sidebar.Item.Badge className="condensed">{badges}</Sidebar.Item.Badge>}
				{menu && (
					<Sidebar.Item.Menu {...handleMenuEvent}>
						{menuVisibility ? (
							menu()
						) : (
							<ActionButton square ghost mini rcx-sidebar-item__menu icon='kebab' />
						)}
					</Sidebar.Item.Menu>
				)}
			</Sidebar.Item.Content>
			{actions && (
				<Sidebar.Item.Container>
					{<Sidebar.Item.Actions>{actions}</Sidebar.Item.Actions>}
				</Sidebar.Item.Container>
			)}
		</Sidebar.Item>
	);
};

export default memo(Condensed);
