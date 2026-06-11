# STEM Learning Lab

A mobile science lab for Grade 6 students. Teams run hands-on STEM experiments, capture data with the phone's sensors and camera, compare results to their predictions, and compete on activity leaderboards.

Built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev) for Android and iOS.

## Features

- **Seven guided activities** — parachute drop, sound measurement, fan challenge, earthquake-resistant structures, human performance, reaction time, and chest breathing motion
- **Predict → capture → reflect** — each activity follows a structured flow: make predictions, record measurements, review a dashboard, and write a reflection
- **Team collaboration** — create or join a team with a join code; some activities are team-based, others are individual
- **Live leaderboards** — rankings per activity, synced through Firestore
- **Accounts & profiles** — email/password sign-in, school location on registration, password change, and light/dark theme
- **Localization** — English and Bahasa Indonesia
- **Offline-friendly drafts** — activity progress is stored locally (SQLite) and uploaded when connectivity returns

## Activities

| Activity | Sensors / inputs |
| --- | --- |
| Parachute Drop | Camera (slow-motion video, fall-time analysis) |
| Decibel Detector | Microphone (classroom sound levels) |
| Hand Fan Challenge | Camera (bend-angle measurement from video) |
| Earthquake-Resistant Structure | Accelerometer & level sensor |
| Human Performance Lab | Accelerometer (movement smoothness) |
| Reaction Board Challenge | Touch screen (reaction time & tracing) |
| Chest Breathing Motion | Accelerometer & gyroscope (breathing rate) |

## Tech stack

- **Framework:** Expo SDK 54, Expo Router (file-based routing), React Native 0.81
- **Backend:** Firebase Authentication & Cloud Firestore
- **Local storage:** Expo SQLite (activity drafts, upload queue)
- **Device APIs:** Camera, microphone, location, motion sensors, battery monitoring
- **Ads:** Google AdMob (optional; test IDs used in development)
- **Testing:** Jest (unit), Maestro (UI flows on Android)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A [Firebase](https://console.firebase.google.com/) project with Email/Password auth and Firestore enabled
- For device testing: Android Studio emulator, iOS Simulator (macOS), or a physical device with [Expo Go](https://expo.dev/go) / a development build

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your Firebase Web app config (Project settings → Your apps → Web):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

AdMob keys are optional for local development.

### 3. Firebase console setup

Follow the step-by-step checklist in [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) — enable auth, create Firestore, and publish the rules from `firestore.rules`.

After changing `.env`, restart with a clean cache:

```bash
npx expo start -c
```

## Running the app

```bash
# Start the dev server (Expo Go or dev client)
npm start

# Run on a connected Android device or emulator
npm run android

# Run on iOS Simulator (macOS only)
npm run ios

# Run in the browser (limited — most sensor features need a device)
npm run web
```

Use the Expo dev tools to open the app in Expo Go, an emulator, or a development build.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Build and run on Android |
| `npm run ios` | Build and run on iOS |
| `npm run web` | Start for web |
| `npm test` | Run Jest unit tests |
| `npm run lint` | Run ESLint |

## Testing

**Unit tests** — physics, dashboard, and utility logic:

```bash
npm test
```

**Maestro UI flows** — Android end-to-end tests. See [`maestro/README.md`](maestro/README.md) for setup (`scripts/use-android-maestro.ps1`) and recommended flow order.

## Project structure

```text
app/                  # Screens and routes (Expo Router)
  (tabs)/             # Main tabs: Home, Rankings, Team, Profile
  activity/[id]/      # Per-activity flow: intro → prediction → capture → dashboard → reflection
components/           # UI and activity capture screens
constants/            # Activity configs, themes, copy
contexts/             # Auth, team, theme, localization, activity session
lib/                  # Firebase, Firestore helpers, SQLite, device utilities
utils/                # Dashboard calculations and domain logic
docs/                 # Firebase setup guide
maestro/              # Maestro test flows
__tests__/            # Jest tests
```

## Production builds

EAS Build profiles are defined in `eas.json` (`development`, `preview`, `production`). Build with the [EAS CLI](https://docs.expo.dev/build/introduction/):

```bash
npx eas-cli build --platform android --profile preview
```

App identifiers:

- **Android:** `com.binanusantara.stemlearninglab`
- **iOS:** `com.binanusantara.stemlearninglab`

