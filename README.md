# AKPKYY Beat Market

Next.js App Router dashboard with Tailwind-first glassmorphism UI and a client-side Silk background.

## Stack

- Next.js (App Router)
- React 19
- Tailwind CSS
- three + @react-three/fiber

## App Structure

- app/layout.tsx: root layout, metadata, font loading, global styles
- app/page.tsx: server entry that renders the client dashboard
- app/_components/DashboardClient.tsx: dashboard shell with active beat state and theme provider wiring
- app/_components/BeatCard.tsx: crystal card UI with editable metadata and optional video visualizer
- app/_components/SilkBackground.tsx: themed WebGL silk background wrapper
- app/_components/Silk.tsx: local Silk shader component with configurable props
- app/_components/ThemeContext.tsx: global runtime theme state for background, card tint, and accents
- app/_components/ThemeCustomizer.tsx: floating panel for live color customization
- app/_components/themeColor.ts: shared color utilities for rgba and shading transforms

## Scripts

- npm run dev: start Next development server
- npm run build: create production build
- npm run start: run production server
- npm run lint: run ESLint

## Debug Launch

Use the VS Code launch configuration named Launch Next App.
