# Testing Infrastructure

This document describes the testing setup for the Monday Clone application.

## Overview

The application uses [Vitest](https://vitest.dev/) for unit and integration testing, with [React Testing Library](https://testing-library.com/react) for component testing.

## Frontend Testing

### Setup

- **Vitest**: Fast unit test framework
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment for tests
- **@testing-library/jest-dom**: Custom matchers for DOM testing

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Test Structure

Tests are located alongside source files with `.test.tsx` or `.spec.tsx` extensions.

Example:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Test Setup

The test setup file (`src/test/setup.ts`) includes:
- Jest DOM matchers
- Cleanup after each test
- Mock implementations for:
  - `window.matchMedia`
  - `IntersectionObserver`
  - `ResizeObserver`

## Backend Testing

### Setup

- **Vitest**: Fast unit test framework
- **Node environment**: Tests run in Node.js environment

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### Test Structure

Tests are located in `src/test/` directory with `.test.ts` or `.spec.ts` extensions.

Example:
```typescript
import { describe, it, expect } from 'vitest'

describe('MyService', () => {
  it('should do something', () => {
    expect(1 + 1).toBe(2)
  })
})
```

## Writing Tests

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders and handles user interaction', () => {
    const queryClient = new QueryClient()
    
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyComponent />
        </BrowserRouter>
      </QueryClientProvider>
    )

    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)
    
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### API Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { myApiFunction } from './api'

describe('API Functions', () => {
  it('should handle API calls', async () => {
    const result = await myApiFunction()
    expect(result).toBeDefined()
  })
})
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Accessible Queries**: Prefer `getByRole`, `getByLabelText`, etc.
3. **Keep Tests Simple**: One assertion per test when possible
4. **Mock External Dependencies**: Mock API calls, timers, etc.
5. **Test User Interactions**: Use `fireEvent` or `userEvent` for interactions
6. **Clean Up**: Tests automatically clean up after each test

## Coverage

Coverage reports are generated using Vitest's built-in coverage provider (v8).

To view coverage:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## CI/CD Integration

Tests can be run in CI/CD pipelines:

```bash
# Run tests once (non-watch mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Future Enhancements

- E2E testing with Playwright (already installed)
- Visual regression testing
- Performance testing
- API integration tests
- Database integration tests

