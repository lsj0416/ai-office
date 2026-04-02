import '@testing-library/jest-dom'

// ResizeObserver mock (jsdom에서 미지원)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
