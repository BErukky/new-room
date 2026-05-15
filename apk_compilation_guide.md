# 📱 Guide: Compiling your App to APK

To compile your application into an installable APK for Android, we will use **EAS Build** (Expo Application Services). I have already configured your project files to support this.

## 🛠️ Step 1: Install EAS CLI
If you haven't already, install the EAS command-line tool globally on your machine:
```powershell
npm install -g eas-cli
```

## 🔐 Step 2: Login to Expo
Log in to your Expo account in your terminal. If you don't have one, you can create it at [expo.dev](https://expo.dev/signup).
```powershell
eas login
```

## 🔗 Step 3: Link Project
Run this command to link your local project to your Expo account:
```powershell
eas build:configure
```
*When prompted, select **Android** and then **Yes** to configure the project.*

## 🚀 Step 4: Start the Build
Run the following command to start the build process for Android using the `preview` profile (which I configured to output an APK):
```powershell
eas build -p android --profile preview
```

### 📋 What happens next?
1. **Cloud Build**: EAS will upload your code and build the APK on their servers. This means you don't need a powerful computer or Android Studio installed.
2. **Download Link**: Once the build is finished (usually takes 5-10 minutes), the terminal will provide a **link to download your APK**.
3. **Install**: You can send this APK file to any Android device, open it, and install it directly!

---

### ⚙️ Changes I've made for you:
- **`app.json`**: Added `"package": "com.kilasho.newroom"`. This is a unique identifier required for Android apps.
- **`eas.json`**: Created this file with a `preview` profile. By default, Expo builds `.aab` files for the Play Store, but this profile is specifically set to output an `.apk` file for direct distribution.
