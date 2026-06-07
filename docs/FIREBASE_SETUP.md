# Firebase setup checklist (Auth + Firestore)

Complete every step in order. Your app code is already wired; these are **Firebase Console** and **`.env`** steps.

---

## Part A — Firebase project (one time)

### 1. Create / open project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Open your project (or create one).

### 2. Register a **Web** app (required for this Expo app)

1. **Project settings** (gear) → **Your apps** → **Add app** → **Web** (`</>`).
2. Copy the `firebaseConfig` values into `.env` (see `.env.example`).

### 3. Enable **Authentication**

1. **Build** → **Authentication** → **Get started**.
2. **Sign-in method** tab:
   - Enable **Email/Password**.

### 4. Enable **Firestore Database**

1. **Build** → **Firestore Database** → **Create database**.
2. Choose a region close to your users.
3. For development you can start in **test mode**, then **must** publish proper rules (Part C).

### 5. Paste **Security rules**

1. **Firestore Database** → **Rules**.
2. Copy all contents from `firestore.rules` in this repo.
3. Click **Publish**.

### 6. Leaderboard queries (no custom index required)

Rankings read every team’s `activityResults` subcollection in one collection-group query and filter by activity in the app. You do **not** need to create a composite or single-field index for leaderboards to work.

---

## Part B — `.env` file (required)

In project root, `.env` should look like this (no quotes, no spaces around `=`):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

Restart after any change:

```bash
npx expo start -c
```

---

## Part C — Firestore data model (automatic)

The app uses these collections:

| Path | Purpose |
|------|---------|
| `users/{uid}` | Profile, email, `teamId` link |
| `teams/{teamId}` | Team name, join `code`, grade, `members` |
| `teams/{teamId}/activityResults/{activityId}` | Activity capture + reflection |

You do **not** create these manually; the app writes them when users register teams and save reflections.

---

## Part D — Test the full flow

1. **Create account** with email and password.
2. **Register new team** → name, grade, members → **Continue**.
3. In Firebase Console → **Firestore**, confirm `teams` and `users` documents exist.
4. Complete a science activity → **Reflection** → **Save & continue**.
5. Confirm `teams/{id}/activityResults/{activityId}` in Firestore.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Firebase .env is missing” | Fill all `EXPO_PUBLIC_FIREBASE_*` keys, restart with `-c` |
| Email login fails | Enable Email/Password in Authentication |
| Firestore permission denied | Publish `firestore.rules`; user must be signed in |
| “No team found” on join | Use exact join code from team captain (`#CODE` without `#` is OK) |
| “No names available” on join | Captain must add your name on **Team members** before you join; then pick it on the next screen |
| Permission denied when joining | Republish `firestore.rules` (includes `isJoiningTeam` for new members) |

---

## Optional later (App Store / Play Store)

- Add **iOS** and **Android** apps in Firebase (same project).
- Use EAS Build + native config files when you move off Expo Go only.
