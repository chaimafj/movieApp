import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../../environments/environment';

export const isFirebaseConfigured = !environment.firebase.apiKey.startsWith('VOTRE_');

export const firebaseApp = initializeApp(environment.firebase);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
