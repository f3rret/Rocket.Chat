import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Subscriptions } from '../../app/models';

Meteor.methods({
	toggleAutoDownload(rid, autoDownloadP2P) {
		/*check(rid, String);

		check(autoDownloadP2P, Match.Optional(Boolean));
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'toggleAutoDownload',
			});
		}

		const userSubscription = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!userSubscription) {
			throw new Meteor.Error('error-invalid-subscription',
				'You must be part of a room to enable autodownload',
				{ method: 'toggleAutoDownload' },
			);
		}*/

		return Subscriptions.setAutoDownloadByRoomIdAndUserId(rid, Meteor.userId(), autoDownloadP2P);
	},
});