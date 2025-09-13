# Overview

Discord Bot Zyne is a moderation-focused Discord bot with an integrated web dashboard. The project consists of two main components: a Discord bot that provides moderation commands (ban, unban, timeout, lock/unlock channels) and a comprehensive web-based dashboard for monitoring bot status and server information. The dashboard provides real-time server listings, detailed guild information, and bot status monitoring similar to MEE6/ProBot interfaces. The bot is designed for server administration with comprehensive logging capabilities and permission-based command execution.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Technology Stack**: Vanilla HTML, CSS, and JavaScript with no framework dependencies
- **Design Pattern**: Single-page application with dynamic content loading and real-time bot status updates
- **Styling**: CSS Grid and Flexbox layouts with gradient backgrounds and card-based UI components inspired by MEE6/ProBot interfaces
- **API Integration**: Fetch-based REST API communication with the backend dashboard server for guild and bot data
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

## Backend Architecture
- **Bot Framework**: Discord.js v14 with modular command structure using ES6 modules
- **Web Server**: Express.js server serving both API endpoints and static frontend files on port 5000
- **Command System**: Slash command implementation with permission-based access control
- **Process Management**: Dual-process architecture running bot and dashboard simultaneously via spawn processes
- **API Endpoints**: RESTful API providing bot status, guild listings, and detailed server information
- **Discord Integration**: Separate Discord client for dashboard API calls to fetch guild data

## Data Storage Solutions
- **Configuration**: Environment variable-based configuration for sensitive data like bot tokens
- **Logging**: Channel-based logging system with hardcoded log channel ID for moderation actions
- **Session Management**: Express-session middleware for web dashboard state management

## Authentication and Authorization
- **Discord Permissions**: Role-based permission checking using Discord.js permission flags
- **Bot Authentication**: Discord bot token authentication for API access
- **Command Security**: Permission validation before command execution (BanMembers, ModerateMembers permissions)
- **OAuth Integration**: Passport.js with Discord OAuth strategy for potential web authentication

## Design Patterns
- **Modular Commands**: Each bot command implemented as separate ES6 modules with dedicated handlers
- **Error Handling**: Comprehensive try-catch blocks with user-friendly error messages
- **Logging Strategy**: Centralized logging to specific Discord channels for audit trails
- **Dual Client Architecture**: Separate Discord client instances for bot operations and API calls

# External Dependencies

## Core Libraries
- **discord.js**: Discord API wrapper for bot functionality and guild management
- **express**: Web server framework for dashboard backend API
- **cors**: Cross-origin resource sharing middleware for API access
- **dotenv**: Environment variable management for configuration

## Authentication Services
- **passport**: Authentication middleware framework
- **passport-discord**: Discord OAuth2 strategy for user authentication
- **express-session**: Session management for web dashboard persistence

## Cloud Services
- **Firebase**: Client-side Firebase SDK for potential data persistence
- **Firebase Admin**: Server-side Firebase administration for backend operations

## Development Tools
- **ES6 Modules**: Native JavaScript module system for code organization
- **Node.js Spawn**: Child process management for concurrent bot and dashboard execution