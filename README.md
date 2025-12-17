# Client - React Native Expo App

The frontend for the Poros application, built with React Native and Expo.

## 🚀 Quick Start (Team Onboarding)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in this directory. Ask the project lead for the current keys.

**Required Variables:**
```env
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
EXPO_PUBLIC_TAVILY_API_KEY=tvly-...
```

### 3. Critical: Configure Local IP
The app needs to know where your backend running.
1.  Open your `.env` file.
2.  Add or update the `EXPO_PUBLIC_API_URL` variable with **your computer's local LAN IP address**.
    ```env
    EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
    ```
    *   **Do NOT use `localhost`** if testing on a physical device.
3.  **Restart Expo with clear cache:**
    ```bash
    npx expo start --clear
    ```

**How to find your IP:**
*   **Mac:** `Settings > Wi-Fi > Details` or terminal: `ipconfig getifaddr en0`
*   **Windows:** Terminal: `ipconfig` (Look for IPv4)

### 4. Run the App
```bash
npx expo start
```
- Scan the QR code with your phone (Expo Go).
- Or press `i` for iOS Simulator / `a` for Android Emulator.

---

## Features
- **User Authentication**: Login/Signup with persistent session.
- **Resume Management**: Upload, rename, and view resumes (Cloud synced).
- **Tailoring**: Generate custom resumes using AI.
- **Target Companies**: Track potential employers and checklists.
- **Job Applications**: Manage your application pipeline.
