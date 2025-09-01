# MedLabScan Frontend

A React + Tailwind CSS based frontend for medical laboratory scanning system.

## Features

- **InfoBox Page**: A prescription display page with all the specified requirements:
  - ✅ White full background
  - ✅ Prescription box with single color (blue) + shadow
  - ✅ Responsive design
  - ✅ Back button (top-left)
  - ✅ Title "Prescription" at top
  - ✅ Mic/Speaker button at bottom absolute
  - ✅ Medicine details inside box

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

- The app starts at the home page with a "View Prescription" button
- Click the button to navigate to the InfoBox page (`/infobox`)
- Use the back button (top-left) to return to the home page
- The prescription box displays sample medicine details
- The mic/speaker button is positioned at the bottom center

## Technologies Used

- React 18
- React Router DOM
- Tailwind CSS
- Vite (Build tool)

## Project Structure

```
src/
├── components/
│   └── InfoBox.jsx      # Prescription display component
├── App.jsx              # Main app with routing
├── main.jsx             # App entry point
└── index.css            # Tailwind CSS imports
```
