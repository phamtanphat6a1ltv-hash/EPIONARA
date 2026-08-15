import "@testing-library/jest-dom";
import { vi } from "vitest";
import { webcrypto } from "node:crypto";

// Ensure global crypto works inside jsdom / node environment
if (typeof window !== "undefined" && !window.crypto) {
  Object.defineProperty(window, "crypto", {
    value: webcrypto,
    writable: true,
  });
}

// Ensure localStorage exists and is clean before each test
if (typeof window !== "undefined") {
  let store = {};
  
  // Create mock if not present
  if (!window.localStorage) {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
          store[key] = String(value);
        }),
        removeItem: vi.fn((key) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          store = {};
        }),
      },
      writable: true,
    });
  }
}
