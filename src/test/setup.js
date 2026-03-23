import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage with proper state tracking
const localStorageStore = new Map()
global.localStorage = {
  getItem: (key) => localStorageStore.get(key) ?? null,
  setItem: (key, value) => localStorageStore.set(key, value),
  removeItem: (key) => localStorageStore.delete(key),
  clear: () => localStorageStore.clear(),
}

// Mock crypto for security.js
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    subtle: {
      digest: async () => new ArrayBuffer(32),
    },
  },
  writable: true,
  configurable: true,
})
