# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js-based Minecraft Wiki API service that scrapes and converts Minecraft Chinese Wiki content to structured data and Markdown. The application uses Express.js with middleware for security, rate limiting, and logging.

## Common Development Commands

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run all tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Architecture

The application follows a layered architecture:

- **API Layer** (`src/index.js`): Express server with middleware for security, CORS, rate limiting, and error handling
- **Services Layer** (`src/services/`): Core business logic for URL building and HTML parsing
  - `SearchUrlBuilder`: Constructs proper search URLs for Minecraft Wiki with encoding and namespace support
  - `SearchResultsParser`: Parses HTML search results into structured JSON data with Cheerio
- **Utils Layer** (`src/utils/`): Shared utilities for HTTP client and Winston logging
- **Config Layer** (`src/config/`): Environment-based configuration management with validation

## Key Components

### SearchUrlBuilder (`src/services/searchUrlBuilder.js`)
- Handles URL construction for wiki searches with proper Chinese character encoding
- Supports multiple namespaces (Main, Template, Module, etc.)
- Provides namespace mappings for Minecraft Wiki structure
- Methods: `buildSearchUrl()`, `buildPageUrl()`, `getNamespaces()`

### SearchResultsParser (`src/services/searchResultsParser.js`) 
- Parses HTML search results using Cheerio jQuery-like selectors
- Extracts title, URL, snippet, namespace, and metadata from search results
- Handles pagination information and result counts
- Methods: `parseSearchResults()`, `hasNoResults()`, `extractSuggestions()`

### Configuration System (`src/config/index.js`)
- Environment variable management with defaults
- Configuration validation on startup
- Support for server, wiki, cache, rate limiting, and logging settings
- Helper methods: `get()`, `isDevelopment()`, `isProduction()`

## Testing

- **Framework**: Jest with coverage thresholds (80% for branches, functions, lines, statements)
- **Setup**: `tests/setup.js` provides test environment configuration
- **Test Types**: Unit tests for services, integration tests for API endpoints
- **Coverage**: Excludes main entry point (`src/index.js`) from coverage requirements

## Environment Variables

Key environment variables (see `config/default.js` for complete list):
- `PORT`: Server port (default: 3000)
- `WIKI_BASE_URL`: Minecraft Wiki base URL (default: https://zh.minecraft.wiki) 
- `NODE_ENV`: Environment mode (development/production/test)
- `REQUEST_TIMEOUT`: HTTP request timeout in ms (default: 10000)
- `RATE_LIMIT_WINDOW`: Rate limiting window in ms (default: 60000)
- `RATE_LIMIT_MAX`: Max requests per window (default: 100)
- `LOG_LEVEL`: Winston log level (default: info)

## API Endpoints

Current endpoints (defined in `src/index.js`):
- `GET /health` - Health check with uptime and version info
- `GET /api` - API information and available endpoints list
- Planned: `GET /api/search?q={keyword}&limit={number}` - Wiki search
- Planned: `GET /api/page/{pageName}` - Page content retrieval