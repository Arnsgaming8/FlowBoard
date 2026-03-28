# Active Context: FlowBoard Productivity Suite

## Current State

**Status**: ✅ Fully built and operational

FlowBoard is a comprehensive, fully client-side productivity suite built on Next.js 16 with static export for GitHub Pages. No backend required - all data persisted to localStorage.

## Recently Completed

- [x] Full project build with 6 views: Dashboard, Kanban, Notes, Calendar, Pomodoro, Analytics
- [x] Static export configuration for GitHub Pages (`output: "export"`)
- [x] Global state management with React useReducer + localStorage persistence
- [x] Kanban board with HTML5 drag-and-drop, multi-board support, task CRUD
- [x] Markdown notes editor with live preview, folders, tags, search
- [x] Calendar with month grid, event management, color coding
- [x] Pomodoro timer with Web Audio API notifications, session tracking
- [x] Analytics dashboard with custom SVG charts (donut, bar, grouped bar)
- [x] Command palette (⌘K) with keyboard navigation
- [x] Dark/light mode toggle
- [x] Data export/import (JSON backup, CSV export)
- [x] Responsive sidebar with collapsible navigation
- [x] Toast notification system
- [x] TypeScript strict mode, ESLint passing, production build

## Project Structure

| File/Directory | Purpose |
|---|---|
| `src/app/page.tsx` | Root page - wires AppProvider + all views |
| `src/app/layout.tsx` | HTML shell with dark mode support |
| `src/app/globals.css` | Tailwind + custom animations |
| `src/lib/types.ts` | All TypeScript types + defaults |
| `src/lib/store.tsx` | AppProvider, useReducer, localStorage persistence |
| `src/lib/utils.ts` | uid, date helpers, markdown parser, export/import |
| `src/components/Sidebar.tsx` | Navigation sidebar with data controls |
| `src/components/CommandPalette.tsx` | ⌘K command palette |
| `src/components/Toast.tsx` | Toast notification provider |
| `src/components/Dashboard.tsx` | Overview with stats, charts, recent activity |
| `src/components/Kanban.tsx` | Multi-board kanban with drag-and-drop |
| `src/components/Notes.tsx` | Markdown notes with sidebar, folders, preview |
| `src/components/Calendar.tsx` | Month calendar with event management |
| `src/components/Pomodoro.tsx` | Focus timer with circular progress |
| `src/components/Analytics.tsx` | Charts: donut, bar, grouped bar, SVG |

## Architecture Notes

- **Zero dependencies**: Only Next.js, React, Tailwind (no chart libs, no drag libs, no markdown libs)
- **Client-side only**: `"use client"` on all interactive components
- **Persistence**: localStorage with key `flowboard-state`
- **State**: Single useReducer in AppProvider, dispatched via context
- **Drag-and-drop**: Native HTML5 drag API (no react-dnd)
- **Markdown**: Custom regex-based parser (no marked/remark)
- **Charts**: Custom SVG (no recharts/chart.js)
- **Audio**: Web Audio API oscillator for pomodoro alerts
- **Static export**: `next.config.ts` has `output: "export"` for GitHub Pages

## Session History

| Date | Changes |
|------|---------|
| 2026-03-28 | Built entire FlowBoard productivity suite from template |
