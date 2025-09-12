# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Contrat Manager is an Electron-based desktop application for managing temporary mission contracts. It's built with React, uses localStorage for data persistence, and includes PDF generation capabilities with Puppeteer. The app supports both installed and portable deployment modes.

## Common Commands

### Development
- `npm run dev` - Start development mode (runs React dev server + Electron)
- `npm run react-start` - Start React dev server only
- `npm start` - Start Electron app in production mode

### Building and Packaging
- `npm run build` - Build React application for production
- `npm run electron-build` - Build Electron application
- `npm run package-win` - Create Windows portable executable
- `npm run make-portable` - Build and package for Windows portable
- `npm run release` - Build and publish for distribution

### Scripts Available
- `build-portable.bat` - Windows batch script for portable build
- `package-app.bat` - Windows batch script for packaging
- `start-app.bat` - Windows batch script to start the app

## Architecture

### Core Structure
```
src/
├── modules/           # Feature modules (employees, clients, contracts, etc.)
├── components/        # Shared React components
├── services/         # Business logic services
└── utils/           # Utility functions
```

### Module-Based Architecture
Each main feature is organized as a module with its own:
- Service layer (e.g., `EmployeeService.js`)
- Components (forms, lists, profiles)
- Route handlers

Main modules:
- `dashboard/` - Application dashboard and analytics
- `employees/` - Employee management
- `clients/` - Client management  
- `contracts/` - Contract management
- `timetracking/` - Time tracking functionality
- `invoices/` - Invoice generation and management
- `settings/` - Application configuration

### Data Layer
- **DatabaseService** (`src/services/DatabaseService.js`) - localStorage-based persistence
- **Store prefix**: `cm_` for all localStorage keys
- **Collections**: employees, clients, contracts with auto-incrementing IDs

### Key Services
- **PDFService** - PDF generation using Puppeteer
- **NotificationService** - Toast notifications via react-toastify
- **DatabaseService** - Data persistence and CRUD operations

### Electron Configuration
- **main.js** - Main Electron process
- **preload.js** - Preload script for renderer-main communication
- **config.js** - Handles portable vs installed mode paths
- **Development mode**: Loads from http://localhost:3000
- **Production mode**: Loads from built files

### Portable Mode Support
The app detects portable mode by checking for `portable.txt` in the executable directory. In portable mode:
- Data stored in `data/` folder next to executable
- Templates loaded from `resources/templates/`
- All user data kept within portable directory structure

### Styling
- **TailwindCSS** for styling
- Custom color scheme with primary (#0073ff) and secondary (#0ea5e9) colors
- Inter font family
- Responsive design patterns

## Development Notes

### Component Patterns
- Profile components use tab navigation pattern
- Form components are sectioned for better UX
- List views support both table and card layouts
- Modal components for settings and imports

### State Management
- React hooks for component state
- localStorage for persistence
- Service layer handles business logic
- No external state management library

### PDF Generation
Templates are stored in `templates/` directory and processed with Handlebars before PDF generation via Puppeteer.

### Time Tracking
Global and per-entity time tracking with detailed reporting capabilities.