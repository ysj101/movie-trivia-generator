# CLAUDE.md
必ず日本語で回答してください。
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Movie Trivia Generator** - a Next.js application that scrapes Japanese Wikipedia movie pages and generates engaging trivia using Google's Gemini AI. The app takes a movie title input, searches for production information, and creates exciting trivia facts for users.

## Core Architecture

**Tech Stack:**
- Next.js 15.3.3 with App Router and Turbopack
- TypeScript for type safety
- Tailwind CSS for styling  
- Puppeteer for web scraping
- Google Gemini AI for trivia generation
- React 19 with client-side state management

**Key Architecture Components:**

1. **API Route (`/src/app/api/generate-trivia/route.ts`)**:
   - Single consolidated API endpoint handling all trivia generation
   - Contains three main functions:
     - `searchWikipediaMovies()`: Searches for movie suggestions when exact match fails
     - `scrapeMovieProduction()`: Extracts production information from Wikipedia
     - `generateTriviaFromProduction()`: Uses Gemini AI to create trivia from scraped content
   - Handles multiple error scenarios with intelligent suggestions

2. **Frontend (`/src/app/page.tsx`)**:
   - Single-page React app with custom Tailwind card components
   - Manages state for movie input, trivia results, loading, and error suggestions
   - Features sophisticated card-based UI with gradient designs and animations

3. **Web Scraping Logic**:
   - Targets Japanese Wikipedia specifically (`ja.wikipedia.org`)
   - Searches for "制作" (production) sections in movie pages
   - Filters out series pages, disambiguation pages, and concept pages
   - Provides intelligent movie suggestions when searches fail

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Environment Setup

Required environment variable in `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Key Dependencies & Their Purpose

- `@google/generative-ai`: Gemini AI integration for trivia generation
- `puppeteer`: Headless browser for Wikipedia scraping
- `dotenv`: Environment variable management
- `@tailwindcss/cli`: Tailwind CSS compilation

## API Behavior

The `/api/generate-trivia` endpoint handles three scenarios:
1. **Successful movie found**: Returns trivia and production info
2. **Movie page not found**: Returns error with movie suggestions  
3. **Production section missing**: Returns specific error message

**Input**: `{ "movieTitle": "映画名" }`
**Output**: `{ movieTitle, trivia, productionInfo }` or `{ error, suggestions?, message? }`

## Notable Implementation Details

- **Japanese Language Focus**: All scraping and AI prompts are optimized for Japanese content
- **Intelligent Page Detection**: Distinguishes between movie pages, series pages, and concept pages
- **Graceful Error Handling**: Provides clickable movie suggestions when exact matches fail
- **Performance Optimized**: Uses Turbopack for fast development builds
- **Responsive Design**: Card-based UI with hover effects and animations

## Trivia Generation Logic

The AI is specifically prompted to:
- Extract the most surprising production facts
- Format output as "●●という裏話があります！" (There's a behind-the-scenes story that...)
- Generate exactly one high-quality trivia item (not lists)
- Focus on excitement and surprise value over quantity