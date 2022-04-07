import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Box, Field, Button } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import UserAutoComplete from '../../../../../components/UserAutoComplete';
import VerticalBar from '../../../../../components/VerticalBar';
import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';

const ForwardMessageTo = ({ onClickClose, onClickBack, onClickSave, value }) => {

	const [username, setUsername] = useState();
	const handleForward = ()=> {
		onClickSave(username);
	}

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>Переслать сообщение</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>
			<Box padding='20px'>
				<Field>
					<UserAutoComplete
						value={username}
						onChange={setUsername}
						placeholder={'Выберите пользователя'}
					/>
				</Field>
			</Box>
			<VerticalBar.Footer>
				<Button primary disabled={!username || username == ''} onClick={handleForward}>
					Переслать
				</Button>
			</VerticalBar.Footer>
		</>
	);
};



export default ForwardMessageTo;
