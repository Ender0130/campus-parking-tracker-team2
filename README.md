# CampusPark

A mobile app that helps college students find and track parking on campus — built with React Native and Expo.

---

## Features

- Illustrated welcome screen with a parallax-style background image
- Glass-style campus and residential community dropdowns
- Smooth animated bottom-sheet picker with fade backdrop and spring slide-up
- Campus selector pre-loaded with SDSU (San Diego State University)
- All SDSU on-campus residential communities listed (Aztec Corner, Aztec Shores, Chapultepec Hall, Cuicacalli Suites, Diegueno Hall, Olmeca Hall, South Campus Plaza, Tenochca Hall, Tepeyac Hall, Villa Alvarado, Zura Hall)
- Login button enabled only after both selections are made
- Poppins font (400, 600, 700, 900 weights) throughout
- Navigates to main screen after login

## Tech Stack

| Technology | Purpose |
|---|---|
| [Expo](https://expo.dev) (SDK 54) | App framework & build tooling |
| [Expo Router](https://expo.github.io/router) | File-based navigation |
| [React Native](https://reactnative.dev) | Cross-platform UI |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Animations |
| [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context) | Safe area handling |
| [Poppins (Google Fonts)](https://fonts.google.com/specimen/Poppins) | Typography |
| TypeScript | Type safety |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
git clone https://github.com/amarendra-008/CampusParkingTracker.git
cd CampusParkingTracker/campusparkingtracker
npm install
```

### Running the App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
campusparkingtracker/
├── app/
│   ├── _layout.tsx       # Root navigation layout
│   ├── index.tsx         # Welcome / login screen
│   └── home.tsx          # Main screen 
├── assets/
│   └── images/
│       └── background.png  # Welcome screen background
└── package.json
└── services/
│   ├── api.ts
```

---

> This README was generated with the help of AI.
