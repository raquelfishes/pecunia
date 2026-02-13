/**
 * Mock implementations of Google Apps Script services for testing
 */

class MockCache {
  constructor() {
    this.storage = new Map();
  }

  get(key) {
    const item = this.storage.get(key);
    if (!item) return null;

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.storage.delete(key);
      return null;
    }

    return item.value;
  }

  put(key, value, expirationInSeconds) {
    const expiry = expirationInSeconds
      ? Date.now() + (expirationInSeconds * 1000)
      : null;

    this.storage.set(key, { value, expiry });
  }

  remove(key) {
    this.storage.delete(key);
  }

  removeAll() {
    this.storage.clear();
  }
}

class MockProperties {
  constructor() {
    this.properties = new Map();
  }

  getProperty(key) {
    return this.properties.get(key) || null;
  }

  setProperty(key, value) {
    this.properties.set(key, value);
  }

  deleteProperty(key) {
    this.properties.delete(key);
  }

  deleteAllProperties() {
    this.properties.clear();
  }

  getKeys() {
    return Array.from(this.properties.keys());
  }
}

// Global mock services
global.CacheService = {
  getDocumentCache: () => new MockCache()
};

global.PropertiesService = {
  getDocumentProperties: () => new MockProperties()
};

global.Logger = {
  log: jest.fn()
};

// Mock cache instances for testing
let mockL1Cache = new MockCache();
let mockL2Cache = new MockProperties();

// Override to return consistent instances in tests
global.CacheService.getDocumentCache = () => mockL1Cache;
global.PropertiesService.getDocumentProperties = () => mockL2Cache;

// Helper to reset mocks between tests
global.resetMocks = () => {
  mockL1Cache = new MockCache();
  mockL2Cache = new MockProperties();
  global.CacheService.getDocumentCache = () => mockL1Cache;
  global.PropertiesService.getDocumentProperties = () => mockL2Cache;
  global.Logger.log.mockClear();
};

module.exports = {
  MockCache,
  MockProperties,
  resetMocks: global.resetMocks
};
