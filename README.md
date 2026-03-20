# QuickDock

QuickDock is a beautifully designed, fast, and lightweight Chrome Extension that brings your Quickscrum assignments directly to your side panel. Navigating between your workspace and Quickscrum has never been easier!

## Features
- **Instant Access timeline**: View all your assigned tickets and stories natively in your browser side panel.
- **Lightning Fast Filters**: Find what you need instantly via Project, Type, and text searches.
- **Smart Loading Flow**: Seamlessly fetches history in chunks, cleverly skipping over empty months automatically.
- **1-Click Tracking**: Click on any Ticket or Story row to jump straight to the actual item inside Quickscrum.
- **Copy on Hover**: Need an ID? Hover over your ticket hashes to copy them onto your clipboard instantly.

## How to Setup
1. Extract or clone this repository locally onto your machine.
2. Ensure you have Node JS installed. Run `npm install` and then `npm run build` in your terminal to compile the code!
3. Open Google Chrome and traverse to `chrome://extensions`.
4. Enable the **"Developer mode"** toggle on the top right.
5. Click **"Load unpacked"** and select the `/dist` folder that was just generated!

## Usage and Authentication
QuickDock sources assignments from `no-reply@quickscrum.com` notifications in your Gmail securely. You need to connect your Google Account securely to use it:
1. Open up the QuickDock extension panel from Chrome.
2. Hit the 'Settings' gear icon at the top right of the panel.
3. Click the **"Verify Google Connection"** button to trigger Google's consent popup and grant read access.
4. Set your target workspace URL templates right below the auth status. You're ready to go!
