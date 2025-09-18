require('@testing-library/jest-dom');

// Set up a fake navigator
window.navigator.mediaDevices = {};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};

// Mock cancelAnimationFrame
global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');

// Mock server-side environment variables if needed
process.env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: 'https://mock-supabase-url.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
};