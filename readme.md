# QuickDesk - AI-Powered Help Desk Solution

QuickDesk is a modern, easy-to-use help desk and ticketing system designed to streamline customer support. It features role-based access control, AI-powered suggestions, and a clean, intuitive interface.

## Features

- **Role-Based Access Control**: Distinct dashboards and permissions for End-Users, Support Agents, and Administrators.
- **Comprehensive Ticket Management**: Users can create, view, update, and resolve support tickets with detailed conversation threads.
- **Community Knowledge Base**: Users can browse and learn from previously resolved tickets submitted by the community, promoting self-service.
- **Dynamic Dashboards**:
    - **Admin**: View analytics on user role distribution and overall ticket statuses.
    - **Support Agent**: Track assigned tickets, recent activity, and personal performance.
    - **End-User**: Get a quick summary of personal ticket activity and quick-action buttons for common tasks.
- **Modern Tech Stack**: Built with Next.js, TypeScript, and the latest React features for a fast and reliable user experience.
- **Glassmorphic Design**: A beautiful and modern UI built with ShadCN components and Tailwind CSS.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage)
- **Generative AI**: [Google Genkit](https://firebase.google.com/docs/genkit) (with Gemini)
### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later)
- [npm](https://www.npmjs.com/)

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd <repository-name>
npm install
```

### 2. Firebase Setup

This project requires a Firebase project to run.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new Firebase project.
3.  Go to **Project Settings** > **General**.
4.  Under "Your apps", create a new **Web app**.
5.  Copy the `firebaseConfig` object and paste it into `src/lib/firebase.ts`.
6.  In the Firebase Console, go to **Authentication** > **Sign-in method** and enable the **Email/Password** provider.
7.  Go to **Firestore Database** and create a new database in production mode.

### 3. Running the Development Server

You need to run two separate development servers for the Next.js app and the Genkit AI flows.

**Terminal 1: Run the Next.js App**
```bash
npm run dev
```
The application will be available at `http://localhost:9002`.

**Terminal 2: Run the Genkit AI Flows**
```bash
npm run genkit:watch
```
This will start the Genkit development server, allowing your app to communicate with the AI models.

## Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts a production server.
- `npm run lint`: Runs the linter to check for code quality issues.
- `npm run genkit:dev`: Starts the Genkit server.
- `npm run genkit:watch`: Starts the Genkit server in watch mode.
