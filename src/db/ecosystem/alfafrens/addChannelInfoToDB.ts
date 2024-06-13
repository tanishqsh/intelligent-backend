import { fetchQuery } from '@airstack/node';
import { firebase } from '../../../firebase/firebase';
import { getUserByFID } from '../../../utils/airstack-query-constructors/getUserByFID';

const addChannelInfoToDB = async (userInfo: any) => {
	console.log(`=============================== Attempting to add channel info for user ${userInfo.fid}`);

	const { aFUserAddress, fid, handle, channelAddress } = userInfo;

	// planning this ref: users/{fid}

	const usersRef = firebase.db.collection('users');
	const userRef = usersRef.doc(fid.toString());

	const userSnapshot = await userRef.get();

	if (userSnapshot.exists) {
		try {
			await userRef.update({
				alfafrens: {
					aFUserAddress,
					channelAddress,
					lastSyncedAt: firebase.FieldValue.serverTimestamp(),
				},
			});
			console.log(`User ${fid} updated successfully`);
		} catch (error) {
			console.error(`Error updating user ${fid} in the database:`, error);
		}
	} else {
		try {
			await userRef.set(
				{
					alfafrens: {
						aFUserAddress,
						channelAddress,
						lastSyncedAt: firebase.FieldValue.serverTimestamp(),
						timestamp: firebase.FieldValue.serverTimestamp(),
					},
				},
				{ merge: true }
			);
			console.log(`User ${fid} added to the database successfully`);
		} catch (error) {
			console.error(`Error adding user ${fid} to the database:`, error);
		}
	}
};

const addChannelMembersToDB = async (fid: any, channelData: any, allMembers: any[]) => {
	const numOfSubscribers = channelData?.numberOfSubscribers;
	const numOfStakers = channelData?.numberOfStakers;
	const totalSubscriptionFlowRate = channelData?.totalSubscriptionFlowRate;
	const totalSubscriptionInflowAmount = channelData?.totalSubscriptionInflowAmount;
	const totalClaimed = channelData?.totalClaimed;
	const owner = channelData?.owner;
	const currentStaked = channelData?.currentStaked;

	// add it to the database, update userRef alfafrens object

	// prepare the db reference
	const usersRef = firebase.db.collection('users');
	const userRef = usersRef.doc(fid.toString());
	const userSnapshot = await userRef.get();

	if (userSnapshot.exists) {
		try {
			await userRef.set(
				{
					alfafrens: {
						numOfSubscribers,
						numOfStakers,
						totalSubscriptionFlowRate,
						totalSubscriptionInflowAmount,
						totalClaimed,
						owner,
						currentStaked,
						lastSyncedAt: firebase.FieldValue.serverTimestamp(),
					},
				},
				{ merge: true }
			);
		} catch (error) {
			console.error(`Error updating user ${fid} in the database:`, error);
		}
	}

	// now the loop with allMembers
	const membersRef = userRef.collection('alfafrensMembers');

	allMembers.forEach(async (member) => {
		if (!member.fid) {
			return;
		}

		const memberRef = membersRef.doc(member.fid.toString());

		const memberSnapshot = await memberRef.get();

		if (memberSnapshot.exists) {
			try {
				await memberRef.update({
					...member,
					lastSyncedAt: firebase.FieldValue.serverTimestamp(),
				});
			} catch (error) {
				console.error(`Error updating member ${member.fid} in the database:`, error);
			}
		} else {
			try {
				let result = await fetchQuery(getUserByFID(member.fid));
				const userData = result?.data?.Socials?.Social[0];

				await memberRef.set(
					{
						...member,
						fc_data: userData,
						lastSyncedAt: firebase.FieldValue.serverTimestamp(),
						timestamp: firebase.FieldValue.serverTimestamp(),
					},
					{ merge: true }
				);
			} catch (error) {
				console.error(`Error adding member ${member.fid} to the database:`, error);
			}
		}
	});
};

export { addChannelInfoToDB, addChannelMembersToDB };
