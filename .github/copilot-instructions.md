# Hive Automation App - Snapie Product

A blockchain automation tool for Hive that monitors posts and automatically upvotes/downvotes based on user-defined lists.

## Project Overview
- **Purpose:** Auto-voting bot for Hive blockchain with secure key management
- **Tech Stack:** Node.js, Express, React, SQLite, Docker
- **Theme:** Old Twitter colors (#1DA1F2)
- **Branding:** Snapie product

## Key Features
- Two lists: Good List (upvote) and Shit List (downvote)
- Encrypted posting key storage (AES-256)
- Voting power management with thresholds
- Configurable vote weights, delays, and daily limits
- Block tracking for connection resilience (lastblock.txt)
- Password-protected interface with JWT authentication

## Architecture
- **Backend:** Express API, SQLite database, Hive blockchain streaming
- **Frontend:** React SPA with old Twitter theme
- **Security:** Master password encrypts all posting keys
- **Deployment:** Docker container for VPS deployment

## Development Notes
- Vote only when VP meets threshold (including Shit List)
- Default weights: Good List 50%, Shit List 100%
- Track last processed block in lastblock.txt for resilience
- Dashboard shows: VP levels → Recent votes → START/PAUSE button
