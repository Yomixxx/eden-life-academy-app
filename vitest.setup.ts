import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest runs without `globals: true`, so @testing-library/react cannot
// register its own automatic unmount-between-tests hook.
afterEach(() => {
  cleanup()
})
