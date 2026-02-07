# 🏛️ CitizenConnect - Smart City Issue Reporting App

A comprehensive full-stack React Native application built with Expo and Firebase. This app allows citizens to report and track civic issues in real-time, while providing a robust admin portal for government officials to manage and resolve these reports efficiently.

## 🚀 Technologies Used

- **Frontend**: [React Native](https://reactnative.dev/) with [Expo SDK 54](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Backend**: [Firebase 12](https://firebase.google.com/)
  - **Firestore**: Real-time NoSQL database for reports, users, and departments.
  - **Authentication**: Phone-based OTP authentication for citizens and email/password for admins.
- **State Management**: React Context API ([AppContext](file:///d:/University/Gift%20University/5th%20Semester/Mobile%20Application/Project/Project_Zuraiz/citizen-issue-reporting-app/citizen-issue-reporting-app/src/context/AppContext.js), [LanguageContext](file:///d:/University/Gift%20University/5th%20Semester/Mobile%20Application/Project/Project_Zuraiz/citizen-issue-reporting-app/citizen-issue-reporting-app/src/context/LanguageContext.js))
- **Localization**: Multi-language support (English & Urdu)
- **UI/UX**: 
  - Custom themed components with Light/Dark mode support.
  - Centralized Department Icon system using text emojis.
  - [Expo Vector Icons](https://icons.expo.fyi/) (Ionicons) for UI elements.
- **Device Features**:
  - [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/): GPS-based issue pinpointing.
  - [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/): Visual evidence capturing.

## 📂 Project Structure

```text
citizen-connect/
├── app/                        # Expo Router directory
│   ├── (admin)/                # Admin Portal screens (Dark Theme)
│   │   ├── dashboard.js        # Analytics & Stats overview
│   │   ├── reports.js          # All reports management
│   │   ├── report-detail.js    # Report resolution workflow
│   │   ├── departments.js      # Department management
│   │   ├── users.js            # User management
│   │   └── login.js            # Admin secure login
│   ├── (auth)/                 # Authentication flow
│   │   ├── phone-login.jsx     # OTP entry
│   │   └── register.jsx        # Profile setup
│   ├── (user)/                 # Citizen App screens (Light Theme)
│   │   ├── home.jsx            # Citizen dashboard
│   │   ├── create.jsx          # 3-step report creation form
│   │   ├── reports.jsx         # My reports tracking
│   │   ├── report-detail.jsx   # Detailed view & timeline
│   │   ├── profile.jsx         # User settings & joined time
│   │   └── notifications.jsx   # Real-time updates
│   ├── components/             # Shared UI components
│   ├── _layout.jsx             # Global providers & root layout
│   └── index.jsx               # App entry point (Welcome)
├── src/                        # Core application logic
│   ├── config/                 # Firebase configuration
│   ├── context/                # Context API providers
│   ├── data/                   # Centralized translations & departments
│   ├── services/               # Firebase & API service layer
│   └── utils/                  # Centralized helpers & formatters
├── package.json                # Dependencies & scripts
└── app.json                    # Expo configuration
```

## 📱 Key Features

### 🌍 Multi-language Support
Full application localization in **English** and **Urdu**, including dynamic labels, placeholders, and system messages.

### 👤 For Citizens (Users)
- **Smart Reporting**: Interactive 3-step form with category selection, location detection, and photo upload.
- **Real-time Tracking**: Visual timeline for every report showing its journey from "Pending" to "Closed".
- **Notifications**: Instant alerts when a report's status changes or is assigned.
- **Personalized Profile**: Track joined duration and personal reporting history.

### 🛡️ For Administrators
- **Executive Dashboard**: Visual statistics showing report distribution by status and department.
- **Efficient Workflow**: Assign reports to specific department users and update progress.
- **Centralized Data**: Single source of truth for managing all departments and system users.
- **Secure Management**: Dedicated portal with role-based access.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Expo Go app on your physical device or an Emulator (Android/iOS)

### Installation

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Firebase**
   Update `src/config/firebase.js` with your Firebase project credentials.
4. **Start the app**
   ```bash
   npx expo start
   ```

---
Built with ❤️ for a better community.
