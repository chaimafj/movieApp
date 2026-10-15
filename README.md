# MovieMatch – Gestion de films (Ionic + Angular + Firebase)

Mini-projet Ionic : gestion de films, playlists de favoris et matching entre utilisateurs.

## Fonctionnalités

| Exigence | Implémentation |
|---|---|
| Inscription (nom, prénom, âge, photo caméra) | `pages/register` + `core/photo.ts` (Capacitor Camera, compression JPEG) |
| Authentification | Firebase Auth email / mot de passe (`core/auth.service.ts`) |
| Playlist de films favoris | Champ `favorites` du document `users/{uid}` – onglets **Films** et **Ma playlist** |
| Base de départ | API publique TMDB (films populaires + recherche, `core/movie.service.ts`) |
| Admin : ajouter des films | Onglet **Admin > Films** → collection Firestore `movies` |
| Admin : désactiver (sans supprimer) un utilisateur | Onglet **Admin > Utilisateurs** → champ `disabled` ; connexion refusée et déconnexion immédiate |
| Matching > 75 % | `core/matching.ts` – indice de Jaccard `|A ∩ B| / |A ∪ B|` strictement supérieur à 0,75 |
| Stockage | Cloud Firestore + règles de sécurité (`firestore.rules`) |

## 1. Configurer Firebase

1. Aller sur <https://console.firebase.google.com> → **Ajouter un projet** (Google Analytics facultatif).
2. **Build > Authentication** → *Commencer* → onglet *Sign-in method* → activer **Adresse e-mail/Mot de passe**.
3. **Build > Firestore Database** → *Créer une base de données* (mode production, région `eur3` par ex.).
4. Onglet **Règles** de Firestore → coller le contenu de [`firestore.rules`](./firestore.rules) → *Publier*.
5. ⚙️ **Paramètres du projet** → *Vos applications* → icône **Web `</>`** → enregistrer l'application
   → copier l'objet `firebaseConfig` affiché dans `src/environments/environment.ts`
   (et `environment.prod.ts`) à la place des valeurs `VOTRE_...`.

> La photo est stockée (compressée, ~20-40 Ko) directement dans Firestore : Firebase Storage n'est
> donc pas nécessaire (il exige désormais le forfait payant Blaze).

## 2. Obtenir une clé TMDB (gratuite)

1. Créer un compte sur <https://www.themoviedb.org/signup>.
2. **Paramètres > API** (<https://www.themoviedb.org/settings/api>) → demander une clé *Developer*.
3. Copier la **Clé d'API (v3 auth)** dans `tmdbApiKey` de `src/environments/environment.ts`.

Sans clé TMDB, l'application fonctionne avec uniquement les films ajoutés par l'administrateur.

## 3. Créer le compte administrateur

1. Lancer l'application et s'inscrire normalement.
2. Console Firebase → Firestore → collection `users` → document de ce compte → modifier le champ
   `role` de `user` à `admin`.
3. Se reconnecter : l'onglet **Admin** apparaît.

## Lancer le projet

```bash
npm install
npm start            # ou : npx ionic serve  →  http://localhost:4200
npm test             # tests unitaires (algorithme de matching)
```

Sur navigateur, la caméra utilise la webcam (via `@ionic/pwa-elements`).

### Règles Firestore et test de bout en bout

```bash
npx firebase-tools deploy --only firestore:rules   # publie firestore.rules
node e2e-firebase.mjs                              # 16 vérifications sur le vrai projet Firebase
```

### Comptes de démonstration

| Email | Mot de passe | Remarque |
|---|---|---|
| admin@moviematch.test | admin123 | administrateur |
| alice@moviematch.test | alice123 | 4 favoris |
| bob@moviematch.test | bob123 | 5 favoris (match 80 % avec Alice) |
| charlie@moviematch.test | charlie123 | désactivé par l'admin |

### Sur téléphone Android

```bash
npm install @capacitor/android
npx ng build
npx cap add android
npx cap sync
npx cap open android   # puis lancer depuis Android Studio
```

Ajouter dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

## Structure

```
src/app/
├── core/
│   ├── firebase.ts        initialisation Firebase
│   ├── auth.service.ts    inscription, connexion, profil, favoris, compte désactivé
│   ├── movie.service.ts   TMDB + films ajoutés par l'admin
│   ├── user.service.ts    liste des utilisateurs, activation / désactivation
│   ├── matching.ts        calcul du taux de correspondance (+ matching.spec.ts)
│   ├── guards.ts          authGuard / adminGuard / guestGuard
│   └── photo.ts           prise de photo + compression
└── pages/  login, register, tabs, movies, playlist, matching, profile, admin
```

## Modèle de données Firestore

```
users/{uid}   { nom, prenom, age, email, photo, role: 'user'|'admin', disabled: bool,
                favorites: [{ id, title, posterUrl, releaseDate }], createdAt }
movies/{id}   { title, overview, posterUrl, releaseDate, createdAt }
```

Les identifiants de films sont préfixés (`tmdb_550`, `custom_<docId>`) pour que les films TMDB et
ceux de l'admin soient comparables dans le matching.
