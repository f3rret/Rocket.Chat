import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../app/settings';
import { hasPermission } from '../../app/authorization';
import { Users, Rooms } from '../../app/models';
import { RateLimiter } from '../../app/lib';
import { addUser } from '../../app/federation/server/functions/addUser';
import { createRoom } from '../../app/lib/server';

Meteor.methods({
	async createDirectMessage(...usernames) {
		check(usernames, [String]);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user no userID', {
				method: 'createDirectMessage',
			});
		}

		const me = Meteor.user();

		if (!me.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user no username', {
				method: 'createDirectMessage',
			});
		}

		if (settings.get('Message_AllowDirectMessagesToYourself') === false && usernames.length === 1 && me.username === usernames[0]) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user no allow user dm', {
				method: 'createDirectMessage',
			});
		}

		let us = usernames.filter((username) => username !== me.username);
		let users=[];

		for(let i=0; i < us.length; i++){
			let username=us[i];
			let to=await Users.findOneByUsernameIgnoringCase(username);

			// If the username does have an `@`, but does not exist locally, we create it first
			if (!to && username.indexOf('@') !== -1) {
				to = await addUser(username);
			}

			if(!to){
				console.log('to is nothing, username: ', username);
				let promise=new Promise((resolve, reject)=>setTimeout(()=>{resolve('5sec')}, 5000));
				let after=await promise;
				to=await Users.findOneByUsernameIgnoringCase(username);
			}

			if (!to) {
				console.log('maybe its room?');

				let maybeRoom=Rooms.findOneByIdOrName(username); // хз чо за хрень но так происходит
				if(maybeRoom){
					return {
						t: 'd',
						rid: maybeRoom._id,
						...maybeRoom,
					};
				}

				/*throw new Meteor.Error('error-invalid-user', 'Invalid user 1', {
					method: 'createDirectMessage',
				});*/
			}

			users.push(to);
		};

		if (!hasPermission(Meteor.userId(), 'create-d')) {
			console.log('---no create-d permission---');
			// If the user can't create DMs but can access already existing ones
			if (hasPermission(Meteor.userId(), 'view-d-room')) {
				// Check if the direct room already exists, then return it

				const uids = [me, ...users].map(({ _id }) => _id).sort();
				const room = Rooms.findOneDirectRoomContainingAllUserIDs(uids, { fields: { _id: 1 } });
				if (room) {
					return {
						t: 'd',
						rid: room._id,
						...room,
					};
				}
			}

			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'createDirectMessage',
			});
		}

		const { _id: rid, inserted, ...room } = createRoom('d', null, null, [me, ...users], null, { }, { creator: me._id });

		let promise=new Promise((resolve, reject)=>setTimeout(()=>{resolve('1sec')}, 1000));
		let after=await promise;
		console.log('return room after ', after);

		return {
			t: 'd',
			rid,
			...room,
		};
	},
});

RateLimiter.limitMethod('createDirectMessage', 10, 60000, {
	userId(userId) {
		return !hasPermission(userId, 'send-many-messages');
	},
});
