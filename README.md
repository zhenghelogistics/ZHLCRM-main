
# Zhenghe Logistics Revenue Pipeline

This is an intuitive CRM dashboard for sales and freight executives to track their revenue pipeline, manage leads, and identify unresponsive customers by processing email content using the Gemini API.

## Features

- **AI-Powered Lead Creation**: Paste the content of a sent quote email to automatically extract customer details, quoted price, industry, and a lead quality score.
- **Automated Lead Nurturing**: Leads are automatically moved through follow-up stages (`T+3h`, `T+6h`, `T-24h`) based on time since the quote was sent.
- **Ghosting Detection**: Leads that are unresponsive for over 24 hours are automatically marked as "LOST: GHOSTED".
- **Pipeline Management**: View all active leads in either a card or table view, update notes, and manage their status (Responded, Won, Lost).
- **Comprehensive Reporting**: A full-table view of all leads with powerful filtering by status, stage, and industry.
- **Historical Analysis**: Archive closed deals (Won/Lost) at the end of each month and review historical performance with charts and stats.

## Project Setup

This project is configured to be run in a secure environment like AI Studio, which handles the Gemini API key. To run it locally or fork it, you will need to set up your own Firebase project and provide your own API keys.

### 1. Firebase Setup

This project uses Firebase (Firestore) as its database.

1.  Create your own project at [firebase.google.com](https://firebase.google.com/).
2.  In your project, go to **Project Settings** -> **General**, and find your web app configuration object.
3.  Create a new file in the root directory named `firebaseConfig.local.ts`.
4.  Copy your Firebase config object into this new file. The file should look like this:

    ```typescript
    // firebaseConfig.local.ts
    // This file is NOT committed to git.

    export const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    ```

### 2. Gemini API Key

The application expects the Gemini API key to be available as an environment variable (`process.env.API_KEY`). When running in a secure cloud environment, this is provided for you.

To run locally, you would typically use a `.env` file (which is also ignored by git) to manage this secret.

### 3. Running the App

Once your `firebaseConfig.local.ts` is created, the application should run correctly.
