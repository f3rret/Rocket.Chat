import { Meteor } from 'meteor/meteor';

import { CachedChatSubscription } from '../../app/models/client';

Meteor.methods({
	toggleAutoDownload(rid, autoDownloadP2P) {
			if (!Meteor.userId()) {
				return false;
			}

			CachedChatSubscription.collection.update(
				{
					rid,
					'u._id': Meteor.userId(),
				},
				{
					$set: {
						autoDownloadP2P,
					},
				},
			);
	},
});
