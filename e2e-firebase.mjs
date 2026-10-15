// Test de bout en bout contre le vrai projet Firebase (règles de sécurité déployées).
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const cfg = {
  apiKey: 'AIzaSyBGL2Q6o0EwcHrGbIRQuDEKwEMAOIDrB14',
  authDomain: 'appwithfirebase-a3b71.firebaseapp.com',
  projectId: 'appwithfirebase-a3b71',
  appId: '1:91117943072:web:20ddd474524a752492ff45',
};
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
let failures = 0;
const ok = (cond, label) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`); if (!cond) failures++; };
const denied = async (p, label) => { try { await p; ok(false, label + ' (aurait dû être refusé)'); } catch (e) { ok(e.code === 'permission-denied', `${label} -> ${e.code}`); } };

function session(name) {
  const app = initializeApp(cfg, name);
  return { app, auth: getAuth(app), db: getFirestore(app) };
}

async function registerOrLogin(s, email, password, data) {
  let cred;
  try { cred = await createUserWithEmailAndPassword(s.auth, email, password); }
  catch (e) { if (e.code !== 'auth/email-already-in-use') throw e; cred = await signInWithEmailAndPassword(s.auth, email, password); }
  const ref = doc(s.db, 'users', cred.user.uid);
  if (!(await getDoc(ref)).exists()) {
    await setDoc(ref, { email, ...data, photo: PHOTO, role: 'user', disabled: false, favorites: [], createdAt: Date.now() });
  }
  return cred.user.uid;
}

// Même calcul que src/app/core/matching.ts
const score = (a, b) => { const A = new Set(a), B = new Set(b); if (!A.size || !B.size) return 0; let c = 0; A.forEach((x) => B.has(x) && c++); return c / (A.size + B.size - c); };

async function promoteToAdmin(uid) {
  const token = JSON.parse(readFileSync(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8')).tokens.access_token;
  const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=role`;
  const res = await fetch(url, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { role: { stringValue: 'admin' } } }) });
  if (!res.ok) throw new Error('Promotion admin impossible : ' + (await res.text()));
}

const admin = session('admin'), alice = session('alice'), bob = session('bob'), charlie = session('charlie');

// 1. Inscriptions
const adminUid = await registerOrLogin(admin, 'admin@moviematch.test', 'admin123', { nom: 'Admin', prenom: 'Super', age: 30 });
const aliceUid = await registerOrLogin(alice, 'alice@moviematch.test', 'alice123', { nom: 'Dupont', prenom: 'Alice', age: 22 });
const bobUid = await registerOrLogin(bob, 'bob@moviematch.test', 'bob123', { nom: 'Martin', prenom: 'Bob', age: 24 });
const charlieUid = await registerOrLogin(charlie, 'charlie@moviematch.test', 'charlie123', { nom: 'Durand', prenom: 'Charlie', age: 27 });
ok(true, 'Inscription de 4 comptes (Auth + profil Firestore)');

// 2. Sécurité : un utilisateur ne peut pas se promouvoir admin ni écrire des films
await denied(updateDoc(doc(alice.db, 'users', aliceUid), { role: 'admin' }), 'Alice se met admin');
await denied(addDoc(collection(alice.db, 'movies'), { title: 'Hack', createdAt: 0 }), 'Alice ajoute un film');
await denied(updateDoc(doc(alice.db, 'users', bobUid), { disabled: true }), 'Alice désactive Bob');
await denied(deleteDoc(doc(alice.db, 'users', bobUid)), 'Alice supprime Bob');

// 3. Admin : promotion (console) puis ajout de films
await promoteToAdmin(adminUid);
ok((await getDoc(doc(admin.db, 'users', adminUid))).data().role === 'admin', 'Compte admin promu');
const existing = await getDocs(collection(admin.db, 'movies'));
const titles = ['Inception', 'Interstellar', 'The Dark Knight', 'Le Fabuleux Destin d\'Amélie Poulain', 'Intouchables'];
const movieIds = {};
existing.forEach((d) => (movieIds[d.data().title] = `custom_${d.id}`));
for (const title of titles) {
  if (!movieIds[title]) {
    const ref = await addDoc(collection(admin.db, 'movies'), { title, overview: '', posterUrl: null, releaseDate: '', createdAt: Date.now() });
    movieIds[title] = `custom_${ref.id}`;
  }
}
ok(Object.keys(movieIds).length >= 5, 'Admin ajoute des films à la base');
ok((await getDocs(collection(alice.db, 'movies'))).size >= 5, 'Les utilisateurs voient les films ajoutés');

// 4. Playlists
const fav = (t) => ({ id: movieIds[t], title: t, posterUrl: null, releaseDate: '' });
await updateDoc(doc(alice.db, 'users', aliceUid), { favorites: titles.slice(0, 4).map(fav) });
await updateDoc(doc(bob.db, 'users', bobUid), { favorites: titles.map(fav) });
await updateDoc(doc(charlie.db, 'users', charlieUid), { favorites: titles.slice(0, 2).map(fav) });
ok((await getDoc(doc(alice.db, 'users', aliceUid))).data().favorites.length === 4, 'Alice enregistre sa playlist (4 films)');

// 5. Matching vu par Alice
const users = (await getDocs(collection(alice.db, 'users'))).docs.map((d) => ({ uid: d.id, ...d.data() }));
const me = users.find((u) => u.uid === aliceUid);
const matches = users
  .filter((u) => u.uid !== aliceUid && !u.disabled)
  .map((u) => ({ who: u.prenom, s: score(me.favorites.map((f) => f.id), (u.favorites || []).map((f) => f.id)) }))
  .filter((m) => m.s > 0.75);
console.log('      scores :', users.filter((u) => u.uid !== aliceUid).map((u) => `${u.prenom}=${Math.round(score(me.favorites.map((f) => f.id), (u.favorites || []).map((f) => f.id)) * 100)}%`).join(', '));
ok(matches.length === 1 && matches[0].who === 'Bob', 'Matching > 75% : Alice ↔ Bob (80%), Charlie (50%) exclu');

// 6. Désactivation par l'admin
await updateDoc(doc(admin.db, 'users', charlieUid), { disabled: true });
ok((await getDoc(doc(admin.db, 'users', charlieUid))).data().disabled === true, 'Admin désactive Charlie');
ok((await getDoc(doc(admin.db, 'users', charlieUid))).exists(), 'Charlie n\'est pas supprimé');
await denied(updateDoc(doc(charlie.db, 'users', charlieUid), { favorites: [] }), 'Charlie désactivé modifie sa playlist');
await denied(updateDoc(doc(charlie.db, 'users', charlieUid), { disabled: false }), 'Charlie se réactive lui-même');
await denied(deleteDoc(doc(admin.db, 'users', charlieUid)), 'Admin supprime un utilisateur');

for (const s of [admin, alice, bob, charlie]) { await signOut(s.auth); await deleteApp(s.app); }
console.log(failures ? `\n${failures} échec(s)` : '\nTous les tests sont passés');
setTimeout(() => process.exit(failures ? 1 : 0), 200);
