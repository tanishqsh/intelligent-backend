import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore';
import * as serviceAccount from './intelligent_dev.json';

initializeApp({
	credential: cert(serviceAccount as ServiceAccount),
});

const db = getFirestore();

export const firebase = {
	db,
	Timestamp,
	FieldValue,
	Filter,
};
