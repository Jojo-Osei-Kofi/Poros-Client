# Poros Mobile Client

A React Native and Expo application that helps students organize job searches, manage resumes, track applications, and prepare for target companies.

## Implemented features

- Account creation and JWT-backed sign-in
- Resume upload, organization, and AI-assisted tailoring
- Job-application pipeline tracking
- Target-company lists and preparation checklists
- Company event and learning-resource research
- Persistent client state with Redux Toolkit

## Technology

React Native, Expo, TypeScript, React Navigation, Redux Toolkit, AsyncStorage, and a Node/Express/PostgreSQL backend.

AI and search provider credentials remain on the backend. The client calls authenticated Poros API routes and contains no Anthropic, Tavily, database, or Supabase secrets.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend URL

Copy `.env.example` to `.env`.

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Use `http://10.0.2.2:3000` for an Android emulator. For a physical device, use the development computer's LAN IP and run the phone and computer on the same network.

Follow the [backend setup instructions](https://github.com/Jojo-Osei-Kofi/Poros_data_service) before starting the client.

### 3. Run the app

```bash
npm run lint
npm start
```

Scan the Expo QR code or launch an iOS/Android simulator.

## Architecture and documentation

- [Architecture diagram](Documentation/architecture_diagram.png)
- [Deployment guide](Documentation/DEPLOYMENT.md)
- [Developer guide](Documentation/INTERNAL_DEVELOPER_GUIDE.md)
- [Online help](Documentation/ONLINE_HELP_CONTENT.md)
- [Project overview and usability research](https://github.com/Jojo-Osei-Kofi/Poros-Project)

## Academic context

Poros was built by a five-person Calvin University CS 262 team. The project overview contains team attribution and Jojo Osei-Kofi's documented contributions.
