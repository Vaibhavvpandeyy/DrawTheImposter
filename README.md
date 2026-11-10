# Draw the Imposter

## Publish the web game

The web build is ready for Vercel and the multiplayer server is ready for Render.

1. Create a Render Web Service from this repository. Render will use `render.yaml` and deploy the `server` folder.
2. Copy the deployed server URL, for example `https://your-server.onrender.com`.
3. Import this repository into Vercel, set **Root Directory** to `mobile`, and add the environment variable `EXPO_PUBLIC_SERVER_URL` with the Render URL.
4. Deploy. Vercel will run `npm run export:web` and publish the generated `dist` folder.

### Always-on VPS option

The server also includes `server/Dockerfile` and `server/ecosystem.config.cjs` for an always-on VPS such as DigitalOcean, Lightsail, or Hetzner. Run the server with Docker or PM2, open TCP port 3000, and point `EXPO_PUBLIC_SERVER_URL` at the VPS HTTPS domain.

Private, offline local Wi-Fi party game for 4–5 phones. The Node.js/Socket.IO server runs on one laptop; no account, database, cloud service or public deployment is needed.

## Start the laptop server (Windows)

1. Install Node.js 20 or later on the laptop.
2. Unzip/copy this project to the laptop and open a terminal in its folder.
3. Run `npm install`, then double-click `scripts\start-server.bat` (or run `npm run server`). The server prints each available laptop IPv4 address. Use the address on your Wi-Fi adapter, for example `192.168.1.25`.
4. If Windows Firewall asks, allow Node.js on **Private networks**. Ensure the laptop and phones are connected to the same Wi-Fi (guest Wi-Fi/client isolation may prevent devices from seeing each other).

The default port is 3000. Optionally set `PORT`, `DISCUSS_SECONDS`, or `VOTE_SECONDS` before starting. Drawing turns have no timer; each player can draw up to three strokes or press **Done**. `scripts/start-server.sh` is the macOS/Linux helper. Find an address manually with `ipconfig` (Windows), `ipconfig getifaddr en0` (macOS), or `hostname -I` (Linux).

## Install and connect the Android app

Install [`mobile/android/app/build/outputs/apk/release/app-release.apk`](mobile/android/app/build/outputs/apk/release/app-release.apk) on the phones. Open the app, enter the laptop address as `http://192.168.1.25:3000`, tap **Connect**, and enter a name. One person creates a room; the others enter its four-character code. The host starts at four players. Drawing has no turn timer; each player can make up to three strokes and press **Done**. Discussion lasts 45 seconds and voting lasts 30 seconds by default; the server settings can adjust these durations.

## Build an APK

Requirements for the local Android build: Node.js 20+, Java 21 (Java 17+), and Android SDK platform tools, Android 36 platform, Android Build Tools 35, NDK 27.1.12297006, and CMake 3.22.1. Gradle downloads its wrapper and any missing SDK packages when online. From the project folder:

```powershell
npm install
cd mobile
npm install
npx expo prebuild --platform android
cd android
./gradlew app:assembleRelease
```

The release APK is at `mobile/android/app/build/outputs/apk/release/app-release.apk`. On Windows, run `gradlew.bat app:assembleRelease` instead of `./gradlew`. The APK is signed with the Android debug key for private sideloading. The build configuration uses package name `com.drawtheimposter.game`. Expo's generated native project and build tooling may download packages at build time; gameplay itself uses only LAN after installation.

## Development

`npm run server` starts the server, `npm run test:server` runs server tests, and from `mobile` use `npm start` / `npm run typecheck`. Server memory holds active rooms and scores. Secret roles/words are sent only in private Socket.IO messages; the room snapshot and canvas events do not contain them. The server validates player turns, three-stroke limits, vote eligibility, duplicate votes, chat size, room capacity and phase.

### Test the start screen with two phones

The game requires four players to start. To test with two phones, have one phone create a room and the other join it. From the project folder on the laptop, run `npm run simulate -- ROOMCODE` using the displayed four-character room code. The laptop adds two temporary lobby players; tap **Start game** from the host phone while the helper is running. These test players automatically skip their drawing turns and do not vote. Press Ctrl+C in the helper terminal when finished.

## Current implementation notes

This repository contains the game server and Expo client source. Local Android packaging requires a Java/Android SDK toolchain; `eas.json` also includes an APK preview profile. Keep server and client on the same local network. If a device changes networks or the app is closed, enter the same room code and name and choose **Reconnect to room** where that player's room entry is still present.
