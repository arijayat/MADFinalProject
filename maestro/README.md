# Maestro flows

Run setup first from PowerShell:

```powershell
cd D:\Projects\mobiledev\MADFinalProject
. .\scripts\use-android-maestro.ps1
adb devices
maestro --version
```

The app id for the installed release build is:

```text
com.binanusantara.stemlearninglab
```

Recommended order:

```powershell
maestro test maestro\00-current-install-smoke.yaml
maestro test maestro\10-tabs-settings-profile.yaml
maestro test maestro\11-rankings.yaml
maestro test maestro\20-activity-intros.yaml
maestro test maestro\21-decibel-prediction-capture-entry.yaml
maestro test maestro\24-reaction-board-full.yaml
```

Flows that reset app state or need test data:

```powershell
maestro test maestro\01-auth-guest-validation.yaml

maestro test maestro\02-login-with-env.yaml

$env:MAESTRO_JOIN_CODE="TEAMCODE"
maestro test maestro\04-join-team-with-env.yaml
```

Notes:

- `01-auth-guest-validation.yaml` uses `clearState: true`, so it signs the app out locally.
- Edit the `env:` block at the top of `02-login-with-env.yaml` when the login test account changes.
- The tab, rankings, and activity flows assume the release app is already logged in and has a team.
- Sensor-heavy activities are covered up to their capture entry screens. Camera, microphone, motion, and reflection upload depend on real-world permissions and experiment data, so those flows are intentionally split from the smoke tests.
