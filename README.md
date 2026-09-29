# AI Nutrition Tracker — Mobile App (MVP)

A personal Android nutrition and food-tracking mobile application built with **React Native**, **Expo (SDK 57)**, **TypeScript**, **Expo Router**, and **SQLite**.

All user records and food data stay 100% locally on the device without requiring an account, server, or internet connection.

---

## 🚀 Features

- **Home Dashboard**:
  - Personalized time-of-day greeting ("Good morning, Alex")
  - Daily calorie progress card (current / target kcal with animated progress bar)
  - Macronutrient breakdown cards (Protein, Carbohydrates, Fat)
  - Grouped meal overview (Breakfast, Lunch, Dinner, Snack)
  - Empty state with quick "Add Food" call-to-action
  - Floating "Scan Food" action button

- **Food Diary**:
  - Interactive date selector with month navigation (`< September 2026 >`) and day-by-day strip
  - Meals organized into Breakfast, Lunch, Dinner, and Snack groups
  - Per-item calorie and macro badges
  - Daily total summary card at bottom (total calories & macro grams)
  - Tap any food entry to view details, edit, or delete

- **Add & Edit Food**:
  - Clean manual entry form for food name, meal category, calories, and optional macronutrients (P/C/F)
  - Optional notes and photo attachment (from Camera or Photo Library)
  - Form validation and instant local persistence via SQLite

- **Scan Food (AI-Ready)**:
  - Live full-screen camera preview using `expo-camera` (`CameraView`)
  - Flash toggle, camera flip (front/back), and viewfinder framing guides
  - Alternative photo selection from the device's gallery via `expo-image-picker`
  - Camera permission handling with graceful fallback UI
  - "AI food recognition will be available here" architectural placeholder

- **Photo Preview**:
  - High-resolution review of captured food photos
  - "Retake" to shoot again or "Add Details" to attach directly to a new food record

- **Food Details**:
  - Full-screen view of meal record with photo hero, meal badge, calories, macros, timestamp, and notes
  - Edit and Delete actions with confirmation protection

- **Profile & Settings**:
  - Editable user profile name
  - Daily nutrition targets editor (Calorie goal, Protein, Carbs, Fat)
  - Metric (g) / Imperial (oz) unit preference
  - **Data Management**:
    - **Export Data**: Generates and shares a complete JSON backup of all SQLite records
    - **Clear All Data**: Reset database with confirmation modal

---

## 📁 Project Architecture

```
src/
├── app/                        # Expo Router routes
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Bottom tab navigator (Home, Diary, Scan, Profile)
│   │   ├── index.tsx           # Screen 1 — Home Dashboard
│   │   ├── diary.tsx           # Screen 2 — Food Diary
│   │   ├── scan.tsx            # Screen 4 — Scan Food
│   │   └── profile.tsx         # Screen 7 — Profile & Settings
│   ├── food/
│   │   ├── add.tsx             # Screen 3 — Add / Edit Food Form
│   │   └── [id].tsx            # Screen 6 — Food Details
│   ├── scan/
│   │   └── preview.tsx         # Screen 5 — Photo Preview
│   ├── profile/
│   │   └── targets.tsx         # Daily Nutrition Targets Editor
│   └── _layout.tsx             # Root layout & SQLite initialization
├── components/                 # Modular, reusable UI components
│   ├── CameraPreview.tsx
│   ├── ConfirmationDialog.tsx
│   ├── DateSelector.tsx
│   ├── EmptyState.tsx
│   ├── FoodForm.tsx
│   ├── FoodItem.tsx
│   ├── MealCard.tsx
│   ├── NutritionCard.tsx
│   ├── PhotoPreview.tsx
│   ├── PrimaryButton.tsx
│   ├── ProgressBar.tsx
│   └── SecondaryButton.tsx
├── constants/
│   └── theme.ts                # Design tokens, color palette, typography, radii, shadows
├── database/                   # SQLite database layer
│   ├── database.ts             # SQLite connection & schema migrations
│   ├── foodRepository.ts       # Food CRUD, date queries, and aggregations
│   └── settingsRepository.ts   # Targets, settings, and backup/export
├── types/
│   ├── food.ts                 # FoodItem, DailyTargets, DailyNutritionSummary
│   └── nutrition.ts            # Meal metadata & macro definitions
└── utils/
    ├── date.ts                 # Date formatting & calendar utilities
    └── nutrition.ts            # Energy calculations & progress helpers
```

---

## 💾 Local SQLite Database Schema

```sql
-- Food entries table
CREATE TABLE IF NOT EXISTS foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  calories REAL NOT NULL,
  protein REAL NOT NULL DEFAULT 0,
  carbs REAL NOT NULL DEFAULT 0,
  fat REAL NOT NULL DEFAULT 0,
  photo_uri TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Daily nutrition goals
CREATE TABLE IF NOT EXISTS daily_targets (
  id INTEGER PRIMARY KEY,
  calorie_target INTEGER NOT NULL DEFAULT 2000,
  protein_target INTEGER NOT NULL DEFAULT 120,
  carbs_target INTEGER NOT NULL DEFAULT 220,
  fat_target INTEGER NOT NULL DEFAULT 65
);

-- App user settings
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);
```

---

## 💻 How to Run on PC

You can run this project on your PC using any of the following options:

### Option 1: Web Browser on PC (Quickest)
Run directly in your PC browser (Chrome / Edge / Firefox) without setting up Android Studio:
```bash
npx expo start --web
```
Or run `npx expo start` and press `w` in the terminal. The app will open at `http://localhost:8081`.

---

### Option 2: Android Emulator on PC
If you have **Android Studio** and an Android Virtual Device (AVD) set up on your PC:
1. Start your Android Emulator in Android Studio.
2. In your terminal, run:
```bash
npx expo start --android
```
Or run `npx expo start` and press `a`. Expo will automatically install and launch the app inside your emulator.

---

### Option 3: Physical Android Phone with Expo Go
1. Install **Expo Go** from the Google Play Store on your Android phone.
2. Ensure your phone and PC are connected to the same Wi-Fi network.
3. In your terminal, run:
```bash
npx expo start
```
4. Open the Expo Go app on your phone and scan the QR code shown in the terminal.

---

### Option 4: Build Standalone APK (Production / Direct Install)
As specified in the MVP requirements, to generate an installable Android `.apk`:
```bash
npx eas-cli@latest build --profile preview --platform android
```

---

## 🛠 Useful Development Commands

```bash
# Typecheck TypeScript files
npx tsc --noEmit

# Run ESLint linter
npx expo lint

# Diagnose dependencies and configuration
npx expo-doctor
```

