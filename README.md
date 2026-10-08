# MSP Service Desk (Fabric App)

A small Fabric App where signed-in users can add, edit and delete
clients, tickets and time entries. Data lives in the app's own SQL database in Fabric.

## Deploy (one time)

1. Open a terminal in this folder. You need Node.js 20 or newer.
2. `npm install`
3. `npx rayfin login`  (sign in with your Fabric account)
4. `npx rayfin up --workspace "YOUR WORKSPACE NAME"`
5. Open the app URL it prints. Click "Load sample data" to fill it with demo records.

You do not need to create the App item in the portal first. `rayfin up` creates it.

## After changing code

Run `npx rayfin up` again. It redeploys the app and applies data model changes.

## What is where

- `rayfin/data/` data model (Client, Ticket, TimeEntry) and `schema.ts`
- `src/services/msp.ts` all reads and writes to the database
- `src/pages/HomePage.tsx` and `src/components/` the screens

Everyone who can open the app sees the same shared data (permission is
`@authenticated('*')` on each entity).
