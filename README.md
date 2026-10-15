# AI Nutrition Tracker

AI Nutrition Tracker is a mobile-first food diary built with React Native, Expo SDK 57, TypeScript, and Expo Router. It helps users record meals, review daily nutrition, set nutrition targets, track basic health measurements, and estimate nutrition from a meal photo.

The app does not require an account. Food entries, health information, targets, and settings are stored on the device. Photo-based food analysis sends the selected image to the app's configured analysis API and therefore requires an internet connection; manual food logging works offline.

## Features

### Home dashboard

- Greets the user by their saved name and shows the current day's nutrition.
- Compares calories and macronutrients with the user's daily targets.
- Summarizes entries by breakfast, lunch, dinner, and snack.
- Provides shortcuts to add food and scan a meal.

### Food diary

- Browse entries by date with a calendar/date selector.
- Review meals grouped by meal type, including calories and macro summaries.
- Open an entry to view its photo, serving details, nutrition, notes, and timestamp.
- Edit or delete food entries.

### Add and edit food

- Enter a food name, meal type, calories, protein, carbohydrates, fat, fiber, serving details, and notes.
- Attach an image from the photo library or camera.
- Validate numeric nutrition values before saving.
- Save food records locally.

### Scan a meal

- Take a photo with the device camera or select one from the photo library.
- Review the photo and retake it if needed.
- Request an AI-generated food name, serving estimate, nutrition estimate, confidence, and notes.
- Review the estimate in the food form before adding it to the diary.

AI values are estimates. Users can review and edit the values before saving. The analysis client currently calls `https://ai-nutrition-tracker-api-phi.vercel.app/api/analyze-food`.

### Food library

- Search the food catalog and filter by category.
- Add a food from the library to a diary entry.
- Manage custom food-library records.

### Health and targets

- Save age, height, weight, activity level, and an energy-estimation sex parameter.
- View BMI and a recent weight/height measurement history.
- View recent daily nutrition trends.
- Calculate a suggested daily energy target from the saved profile and activity level.
- Keep default, suggested, and custom nutrition targets distinct; review or apply a suggested target from the profile/settings screen.
- Choose metric or imperial display units.

Health calculations and nutrition targets are informational features, not medical advice.

### Profile and data management

- Set the display name and unit preference.
- Review and edit daily calorie and macronutrient targets.
- Export locally stored app records as JSON using the device share sheet.
- Clear food records, health information, and settings after confirmation.

## Technology

- **Expo SDK 57** and **React Native 0.86**
- **TypeScript 6**
- **Expo Router** for file-based navigation
- **expo-sqlite** for the native on-device database
- Browser storage for the web database implementation
- **expo-camera** and **expo-image-picker** for photo capture and selection
- **expo-file-system** for persistent photo storage
- **React Native Reanimated** and Expo UI packages for native interface support

## Project structure

```text
src/
├── app/                         # Expo Router screens and layouts
│   ├── (tabs)/                   # Home, diary, health, scan, and profile tabs
│   ├── food/                     # Add/edit form and food-entry details
│   ├── food-library/             # Food catalog routes
│   ├── profile/                  # Target editing routes
│   └── scan/                     # Photo review and analysis route
├── components/                   # Reusable forms, cards, charts, and photo UI
├── constants/                    # Theme and design tokens
├── database/                     # Native/web database and data repositories
├── hooks/                        # Shared React hooks
├── services/                     # Food analysis and image persistence
├── types/                        # Food, nutrition, health, and target types
└── utils/                        # Date, health, and nutrition calculations
```

### Data layer

The repository modules in `src/database/` keep SQL and data operations out of the screens:

- `foodRepository.ts` handles diary entries and daily nutrition summaries.
- `foodLibraryRepository.ts` handles built-in and custom catalog items.
- `healthRepository.ts` handles the health profile, measurements, and nutrition trends.
- `nutritionTargetRepository.ts` handles target sources and health-based suggestions.
- `settingsRepository.ts` handles settings, JSON export, and clearing app data.
- `database.native.ts` uses SQLite on native platforms; `database.web.ts` provides browser storage for web.

The native database is named `nutrition_tracker.db`. Photos are written to the app's document directory under `food_photos/`; diary rows store the photo URI. In-memory captured-photo data is used as a display fallback during the current app session.

## Requirements

- Node.js compatible with the installed Expo SDK and npm.
- Android Studio and an Android emulator for emulator runs, or an Android device with Expo Go for development previews.
- For iOS native development, a Mac with Xcode is required for local native builds. Expo Go can be used for supported development features.
- A network connection for Expo tooling and AI photo analysis.

Install dependencies from the repository root:

```bash
npm install
```

## Run the app

Start the Expo development server:

```bash
npx expo start
```

Then select a target in the terminal or Expo Dev Tools:

- Press `a` to open an Android emulator.
- Press `w` to open the web app.
- Scan the QR code with Expo Go on a physical device connected to the same network.

The project uses native Expo modules for the camera, file system, and SQLite. Expo Go includes the project's Expo SDK modules, but native behavior should be verified on a device or emulator. For a custom native development build, configure an EAS development profile and build with:

```bash
npx eas-cli@latest build --profile development --platform android
```

The repository does not currently include an `eas.json`; add the EAS build profiles before using that command. EAS production or preview builds also require project configuration and credentials.

## Useful commands

```bash
# Start the project
npx expo start

# Run the web target
npx expo start --web

# Check TypeScript
npx tsc --noEmit

# Run ESLint
npx expo lint

# Check the Expo project and dependency configuration
npx expo-doctor
```

## Data and privacy notes

- Diary entries, profile details, targets, and preferences are stored locally on the device/browser.
- Export creates a JSON backup that the user can share through the platform share sheet.
- Clearing app data removes local food records, health information, and settings.
- AI photo analysis sends the image bytes and MIME type to the configured API endpoint. Do not use the scan feature with images that should remain entirely on-device.
- The app does not currently document an account system or cloud synchronization feature.

## License

See [LICENSE](LICENSE).
