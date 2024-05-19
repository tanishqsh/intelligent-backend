import { firebase } from '../firebase/firebase';

const addReactionsToDB = async (reactions: any) => {
	// run a loop to add each reaction to the database
	for (let reaction of reactions) {
		// get the reply hash
		console.log('=============================== ');
		console.log('Attempting to add reaction to the database with following details: ');

		// console that its a reaction.reactionType by reaction.reactedBy.profileHandle on reaction.cast.hash, in one line

		console.log(`${reaction.reactionType} by ${reaction.reactedBy.userId} on ${reaction.cast.hash}`);

		// if any of the following is missing, skip this reaction
		if (!reaction.reactionType || !reaction.reactedBy.userId || !reaction.cast.hash) {
			console.log('Skipping reaction due to missing fields');
			console.log('=============================== ');
			continue;
		}

		// prepare the db reference
		const reactionsRef = firebase.db.collection('casts').doc(reaction.cast.hash).collection('reactions');
		const reactionRef = reactionsRef.doc(`${reaction.reactedBy.userId}_${reaction.reactionType}`);
		console.log('DB reference: ', reactionRef.path);

		try {
			// check if the reaction already exists
			const reactionSnapshot = await reactionRef.get();
			if (!reactionSnapshot.exists) {
				// reaction doesn't exist, add it to the db
				await reactionRef.set({
					...reaction,
					lastSyncedAt: firebase.FieldValue.serverTimestamp(),
					timestamp: firebase.FieldValue.serverTimestamp(),
				});

				console.log('✅ Reaction added to the database successfully');
			} else {
				console.log('Reaction already exists, skipping');
			}
		} catch (error) {
			console.error('Error adding reaction to the database:', error);
		}
	}
};

export { addReactionsToDB };
