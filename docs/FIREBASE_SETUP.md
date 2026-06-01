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
   - Enable **Google** → set support email → **Save**.

### 4. Enable **Firestore Database**

1. **Build** → **Firestore Database** → **Create database**.
2. Choose a region close to your users.
3. For development you can start in **test mode**, then **must** publish proper rules (Part D).

### 5. Paste **Security rules**

1. **Firestore Database** → **Rules**.
2. Copy all contents from `firestore.rules` in this repo.
3. Click **Publish**.

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

# Required for Google Sign-In (see Part C)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=....apps.googleusercontent.com
```

Restart after any change:

```bash
npx expo start -c
```

---

## Part C — Google Sign-In (required for “Sign in with Google”)

### 1. Get Web client ID

1. Firebase Console → **Authentication** → **Sign-in method** → **Google**.
2. Expand **Web SDK configuration**.
3. Copy **Web client ID** → paste as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`.

(It looks like `123456789-xxxx.apps.googleusercontent.com`.)

### 2. OAuth redirect URI (Google Cloud)

Use the **Web client** OAuth ID (the same one as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).

1. Open [Google Cloud Console](https://console.cloud.google.com/) → same project as Firebase.
2. **APIs & Services** → **Credentials**.
3. Open the **Web client** OAuth 2.0 Client ID.
4. Under **Authorized redirect URIs**, click **+ Add URI**.
5. Paste **only** this (one line, no spaces):

```
https://auth.expo.io/@arijt/FinalProj
```

6. Click **Save**.

Username: `npx expo whoami` (yours: `arijt`). Slug: `FinalProj` from `app.json`. If either changes, update this URL to match.

### 3. Test Google sign-in

1. Restart: `npx expo start -c`.
2. Open app → **SIGN IN WITH GOOGLE**.
3. Complete browser flow → you should land in the app and see the user under **Authentication → Users**.

---

## Part D — Firestore data model (automatic)

The app uses these collections:

| Path | Purpose |
|------|---------|
| `users/{uid}` | Profile, email, `teamId` link |
| `teams/{teamId}` | Team name, join `code`, grade, `members` |
| `teams/{teamId}/activityResults/{activityId}` | Activity capture + reflection |

You do **not** create these manually; the app writes them when users register teams and save reflections.

---

## Part E — Test the full flow

1. **Create account** (email) or **Google** sign-in.
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
| Google: “not configured” | Add `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| Google: redirect error | Add redirect URI in Google Cloud Credentials |
| Firestore permission denied | Publish `firestore.rules`; user must be signed in |
| “No team found” on join | Use exact join code from team captain (`#CODE` without `#` is OK) |

---

## Optional later (App Store / Play Store)

- Add **iOS** and **Android** apps in Firebase (same project).
- Use EAS Build + native config files when you move off Expo Go only.

For this course project, **Web app config + `.env` is enough** in Expo Go.
