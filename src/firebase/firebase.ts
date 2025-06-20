import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore';

// The Firebase service-account JSON should be supplied via an environment variable to keep
// credentials out of version control. Expect a stringified JSON in FIREBASE_SERVICE_ACCOUNT.
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
	throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
}

// Parse the JSON string into an object Firebase Admin SDK can accept.
const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

initializeApp({
	credential: cert(serviceAccount),
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

export const firebase = {
	db,
	Timestamp,
	FieldValue,
	Filter,
};
