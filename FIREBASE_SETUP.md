# TaskItUp - Firebase Cloud Messaging Setup Guide

This guide will help you set up background push notifications using Firebase Cloud Messaging (FCM).

## Prerequisites
- Firebase project already set up (Authentication + Firestore enabled)
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Enable Cloud Messaging in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Cloud Messaging** tab
4. Under "Web Push certificates", click **Generate key pair**
5. Copy the generated **VAPID Key** - you'll need this!

## Step 2: Update Your Config Files

### A. Update `src/firebase.js`
Replace the placeholder values with your Firebase config.

### B. Update `src/hooks/usePushNotifications.js`
Find this line and replace with your VAPID key:
```javascript
const VAPID_KEY = 'YOUR_VAPID_KEY'
```

### C. Update `public/firebase-messaging-sw.js`
Replace the Firebase config with your actual values.

## Step 3: Deploy Cloud Functions

1. Login to Firebase CLI:
```bash
firebase login
```

2. Initialize Firebase in your project (if not done):
```bash
firebase init
```
- Select "Functions"
- Choose your project
- Select JavaScript
- Say No to ESLint
- Say Yes to install dependencies

3. Deploy the functions:
```bash
cd functions
npm install
firebase deploy --only functions
```

## Step 4: Set Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules, and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{subcollection}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Step 5: Test It!

1. Deploy your app to Netlify
2. Open the app and log in
3. Go to Settings → Enable "Background Notifications"
4. Allow notifications when prompted
5. Close the browser completely
6. Wait 15 minutes (or check Firebase Functions logs)
7. You should receive a notification!

## How It Works

1. **User enables background notifications** → App gets FCM token and saves it to Firestore
2. **Every 15 minutes** → Cloud Function runs and checks all users' tasks
3. **For each user with overdue tasks** → Function sends push notification via FCM
4. **Phone receives notification** → Even if browser is closed!

## Troubleshooting

### Notifications not arriving?
- Check Firebase Functions logs: `firebase functions:log`
- Verify FCM token is saved in Firestore under `users/{userId}/tokens/fcm`
- Make sure you allowed notifications in browser

### Function errors?
- Check that Firestore security rules allow function access
- Verify Firebase Admin SDK is initialized correctly

### Token invalid errors?
- User may have revoked notification permission
- Token expires if app isn't used for a while
- Re-enable notifications in the app

## Cost Considerations

Firebase Cloud Functions has a generous free tier:
- 2 million invocations/month free
- Running every 15 minutes = ~2,880 invocations/month per function
- FCM is completely free

You won't be charged unless you have thousands of active users!
