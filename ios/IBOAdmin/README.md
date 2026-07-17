# IBO Admin iOS App

Native SwiftUI admin app for the IBO Creative website.

## Open

Open this file on macOS with Xcode:

```text
ios/IBOAdmin/IBOAdmin.xcodeproj
```

## Server URL

- Production: `https://raumwerkpro.de`
- iOS Simulator local testing: `http://127.0.0.1:3000`
- Real iPhone: use the deployed website URL, or use your computer LAN address while the Next.js server is running, for example `http://192.168.1.20:3000`

The app uses the existing website admin APIs:

- Login / logout
- Website content save
- Services add / delete / edit
- Cards add / delete / edit
- Image upload / replace
- Hero image and before / after image control
- Contact details
- Chat replies
- Quote requests
- Add / delete admins

Do not hardcode passwords in the app. Sign in from the login screen.
