# IBO Admin Expo App

Expo React Native admin app for the IBO Creative website.

## Run

```bash
cd mobile/ibo-admin-expo
npm install
npm run start
```

Then open it with:

- Expo Go on iPhone
- iOS Simulator from the Expo dev menu
- Android Emulator from the Expo dev menu

## Server URL

- Production: `https://raumwerkpro.de`
- iOS Simulator local testing: `http://127.0.0.1:3000`
- Real iPhone: use the deployed website URL, or your computer LAN IP while Next.js is running, for example `http://192.168.1.20:3000`

The app signs in through `/api/admin/login` and stores the returned Bearer token with Expo SecureStore. Passwords are not hardcoded in the app.

## Included

- Admin login
- Dashboard
- Website contact editing
- Website live toggles
- Hero image upload / replace
- Service add / edit / delete
- Card/project add / edit / delete
- Image upload / replace
- Before / after control
- Chat inbox with website replies
- Quote requests
- Add / delete admins

## TestFlight

After the App Store Connect app profile exists and the bundle id is available there:

```bash
cd mobile/ibo-admin-expo
npx eas-cli login
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production --latest
```

App Store Connect profile values:

- Name: `IBO Admin`
- Bundle ID: `de.ibocreative.admin`
- SKU: `ibo-admin`
- Platform: iOS
- Primary language: English (U.S.) unless you prefer German
