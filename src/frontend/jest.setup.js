require('@testing-library/jest-dom');

// Polyfill fetch for JSDOM
if (typeof global.fetch === 'undefined') {
  global.fetch = require('whatwg-fetch').fetch;
}

// Polyfill IntersectionObserver for JSDOM
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver;
