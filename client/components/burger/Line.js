import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const Line = ({ animated, moved }) => (
	<Box
		is='span'
		width='x20'
		height='x2'
		backgroundColor='currentColor'
		className={[
			animated &&
				css`
					will-change: transform;
					transition: transform 0.2s ease-out;
				`,
			moved &&
				css`
					&:nth-child(1),
					&:nth-child(3) {
						transform-origin: 50%, 50%, 0;
					}

					&:nth-child(1) {
						transform: translate(-25%, 3px) rotate(-45deg) scale(0.5, 1);
					}

					[dir='rtl'] &:nth-child(1) {
						transform: translate(25%, 3px) rotate(45deg) scale(0.5, 1);
					}

					&:nth-child(3) {
						transform: translate(-25%, -3px) rotate(45deg) scale(0.5, 1);
					}

					[dir='rtl'] &:nth-child(3) {
						transform: translate(25%, -3px) rotate(-45deg) scale(0.5, 1);
					}
				`,
		]}
		aria-hidden='true'
	/>
);

export default Line;
