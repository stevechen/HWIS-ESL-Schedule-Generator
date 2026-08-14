# HWIS Class Scheduler

A SvelteKit application for managing class schedules and communication slips at Hong Wen International School (HWIS). The app helps teachers generate class schedules, track assignments, and create parent communication slips.

## Features

### 📅 Class Schedule Generator

- Generate class schedules for different grade levels (G7/8 CLIL, G7/8 Comm, G9, H10)
- Filter by weekdays (Mon/Tue/Wed/Thu/Fri)
- Automatic day countdown to exams
- Support for oral exam scheduling
- Handle make-up days and special events
- Export schedules as CSV or copy to clipboard

### 📝 Communication Slip Manager

- Create parent communication slips for assignments
- Support for multiple assignment types (Passport, Workbook, Recording, Exam, Speech)
- Batch process multiple students
- Digital signature upload and validation
- Save and load previous records
- Print-ready formatting (B5/JIS-B5)

### 🎵 Frequency Generator

- Simple audio frequency generator tool
- Adjustable frequency with slider and stepper controls
- Persistent settings across sessions

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) 2.x with Svelte 5
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.x
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Testing**:
  - [Vitest](https://vitest.dev/) for unit tests
  - [Playwright](https://playwright.dev/) for E2E tests
- **Package Manager**: [Bun](https://bun.sh/) 1.3.3
- **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) 1.3.3 or later
- Node.js 18+ (for compatibility)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd HWIS-Class_Scheduler

# Install dependencies
bun install
```

### Development

```bash
# Start the development server
bun run dev

# Start with auto-open in browser
bun run dev -- --open
```

The app will be available at `http://localhost:5173`

### Building

```bash
# Create a production build
bun run build

# Preview the production build
bun run preview
```

## Testing

```bash
# Run unit tests
bun run test:unit

# Run E2E tests
bun run test:e2e

# Run E2E tests with UI
bun run test:ui

# Run all tests
bun test
```

## Project Structure

```
src/
├── lib/
│   ├── communication/          # Communication slip logic
│   │   ├── printValidator.ts   # Print validation
│   │   ├── recordManager.svelte.ts  # Record persistence
│   │   ├── signatureValidator.ts    # Signature validation
│   │   └── studentParser.ts    # Student data parsing
│   ├── components/
│   │   ├── communication/      # Communication slip components
│   │   └── Switches.svelte     # Day filter switches
│   ├── config/
│   │   └── classTypes.ts       # Class type definitions
│   ├── data/                   # School event data by semester
│   ├── stores/
│   │   └── communication/      # Communication state management
│   └── utils/                  # Utility functions
│       ├── dateValidation.ts
│       ├── getAllClassDays.ts
│       ├── getClassDaysByType.ts
│       └── schoolYear.ts
├── routes/
│   ├── +page.svelte           # Schedule generator (home)
│   ├── communication/         # Communication slip page
│   └── hz/                    # Frequency generator
└── tests/
    ├── integration/           # Playwright E2E tests
    └── unit/                  # Vitest unit tests
```

## Key Workflows

### Adding School Event Data

School events are stored in `/src/lib/data/` as tab-separated values:

```javascript
// Example: 2024-2025-1-schoolEvents.js
export const schoolEvents = `
2025-01-17	Exam		
2025-01-01	Off	New Year	
2024-12-20	G9 Mock Exam		G9
`;
```

Format: `DATE\tDESCRIPTION\tNOTE\tTYPE`

### Creating Communication Slips

1. Navigate to `/communication`
2. Paste student data (tab-separated: Name, ID, Class, Chinese Name)
3. Select assignment type and dates
4. Upload teacher signature (JPG/PNG, <200KB, height >160px)
5. Print or save the record for later

### Generating Class Schedules

1. Navigate to home page (`/`)
2. Select class type (CLIL, Comm, G9, or H10)
3. Filter by weekdays
4. View generated schedule with countdown
5. Download as CSV or copy to clipboard

## Code Quality

### Linting & Formatting

```bash
# Check code formatting
bun run lint

# Auto-format code
bun run format

# Type checking
bun run check
```

### Type Safety

The project uses TypeScript with strict mode enabled. Key type definitions are in:

- `/src/lib/stores/communication/types.ts`
- `/src/lib/communication/recordManager.svelte.ts`

## Deployment

The app is configured for deployment on Vercel using the `@sveltejs/adapter-vercel` adapter.

```bash
# Build for production
bun run build

# The build output will be in .vercel/output/
```

## Contributing

1. Follow the existing code style (Prettier + ESLint)
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before committing

## License

Private project for Hong Wen International School.

## Acknowledgments

Built with ❤️ for HWIS teachers and students.
