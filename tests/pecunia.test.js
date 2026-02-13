/**
 * Tests for PECUNIA Google Sheets function
 */

// Load mocks before importing the code
require('./mocks/googleAppsMocks');
const {
  PECUNIA,
  processSingleAttribute,
  getCachedFinanceData,
  setCachedFinanceData,
  getHistoricalValue,
  isCacheExpired,
  runCacheTest
} = require('../src/Code.js');

describe('PECUNIA', () => {
  beforeEach(() => {
    global.resetMocks();
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should return empty string for missing symbol', () => {
      expect(PECUNIA('', 'price', 100)).toBe('');
    });

    it('should return empty string for missing attributes', () => {
      expect(PECUNIA('NASDAQ:GOOGL', '', 100)).toBe('');
    });

    it('should cache and return valid values', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
      expect(result).toBe(150.50);
    });

    it('should use cached value when GoogleFinance returns #N/A', () => {
      // First, set a cached value
      PECUNIA('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');

      // Now try with N/A
      const result = PECUNIA('NASDAQ:GOOGL', 'price', '#N/A', '2024-01-01');
      expect(result).toBe(150.50);
    });

    it('should use cached value when GoogleFinance returns #ERROR!', () => {
      // First, set a cached value
      PECUNIA('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');

      // Now try with ERROR
      const result = PECUNIA('NASDAQ:GOOGL', 'price', '#ERROR!', '2024-01-01');
      expect(result).toBe(150.50);
    });

    it('should return #N/A when no cache exists and GoogleFinance returns #N/A', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price', '#N/A', '2024-01-01');
      expect(result).toBe('#N/A');
    });

    it('should use cached value when GoogleFinance is loading', () => {
      // First, set a cached value
      PECUNIA('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');

      // Now try with Loading...
      const result = PECUNIA('NASDAQ:GOOGL', 'price', 'Loading...', '2024-01-01');
      expect(result).toBe(150.50);
    });

    it('should return Loading... when no cache exists and GoogleFinance is loading', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price', 'Loading...', '2024-01-01');
      expect(result).toBe('Loading...');
    });
  });

  describe('Multiple attributes', () => {
    it('should handle comma-separated attributes', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price,volume', [150.50, 1000000], '2024-01-01');
      expect(result).toEqual([150.50, 1000000]);
    });

    it('should handle multiple attributes with cached values', () => {
      // Set cached values
      PECUNIA('NASDAQ:GOOGL', 'price,volume', [150.50, 1000000], '2024-01-01');

      // Now try with N/A values
      const result = PECUNIA('NASDAQ:GOOGL', 'price,volume', ['#N/A', '#N/A'], '2024-01-01');
      expect(result).toEqual([150.50, 1000000]);
    });

    it('should handle mismatched array lengths gracefully', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price,volume,name', [150.50, 1000000], '2024-01-01');
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(150.50);
      expect(result[1]).toBe(1000000);
      expect(result[2]).toBe('#N/A');
    });
  });

  describe('Date handling', () => {
    it('should use provided date', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
      expect(result).toBe(150.50);

      // Verify cached with that date
      const cached = getCachedFinanceData('NASDAQ:GOOGL', 'price', '2024-01-01');
      expect(cached).toBe(150.50);
    });

    it('should use today\'s date when not provided', () => {
      const today = new Date().toISOString().split('T')[0];
      PECUNIA('NASDAQ:GOOGL', 'price', 150.50);

      const cached = getCachedFinanceData('NASDAQ:GOOGL', 'price', today);
      expect(cached).toBe(150.50);
    });
  });

  describe('Cache commands', () => {
    it('should return help text for ? command', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price', '?');
      expect(result).toContain('Commands:');
      expect(result).toContain('SET');
      expect(result).toContain('GET');
    });

    it('should SET a value with cmdOption', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price', 'SET', '2024-01-01', '150.50');
      expect(result).toContain('Set');

      const cached = getCachedFinanceData('NASDAQ:GOOGL', 'price', '2024-01-01');
      expect(cached).toBe('150.50');
    });

    it('should GET a cached value', () => {
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
      const result = PECUNIA('NASDAQ:GOOGL', 'price', 'GET', '2024-01-01');
      expect(result).toBe(150.50);
    });

    it('should return message when GET finds no cache', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price', 'GET', '2024-01-01');
      expect(result).toBe('No cache found');
    });

    it('should REMOVE cached entries', () => {
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 151.00, '2024-01-02');

      const result = PECUNIA('NASDAQ:GOOGL', 'price', 'REMOVE');
      expect(result).toContain('Removed 2 cache entries');

      const cached = getCachedFinanceData('NASDAQ:GOOGL', 'price', '2024-01-01');
      expect(cached).toBeNull();
    });

    it('should LIST cached values', () => {
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
      const result = PECUNIA('', '', 'LIST');
      expect(result).toContain('Cached Finance Data:');
      expect(result).toContain('NASDAQ:GOOGL');
    });

    it('should show no cache message when LIST is empty', () => {
      const result = PECUNIA('', '', 'LIST');
      expect(result).toBe('No cached finance data');
    });

    it('should CLEARCACHE all entries', () => {
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
      const result = PECUNIA('', '', 'CLEARCACHE');
      expect(result).toBe('All cache cleared');

      const cached = getCachedFinanceData('NASDAQ:GOOGL', 'price', '2024-01-01');
      expect(cached).toBeNull();
    });

    it('should TEST cache functionality', () => {
      const result = PECUNIA('', '', 'TEST');
      expect(result).toBe('Cache test PASSED');
    });

    it('should show HISTORY for a symbol', () => {
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 151.00, '2024-01-02');

      const result = PECUNIA('NASDAQ:GOOGL', 'price', 'HISTORY');
      expect(result).toContain('History for NASDAQ:GOOGL price');
      expect(result).toContain('2024-01-01: 150.5');
      expect(result).toContain('2024-01-02: 151');
    });

    it('should return unknown command message', () => {
      const result = PECUNIA('NASDAQ:GOOGL', 'price', 'INVALID');
      expect(result).toContain('Unknown command');
    });
  });
});

describe('Cache functions', () => {
  beforeEach(() => {
    global.resetMocks();
  });

  describe('getCachedFinanceData', () => {
    it('should return null for non-existent cache', () => {
      const result = getCachedFinanceData('NASDAQ:GOOGL', 'price', '2024-01-01');
      expect(result).toBeNull();
    });

    it('should retrieve from L2 cache and promote to L1', () => {
      const l2Cache = PropertiesService.getDocumentProperties();
      const key = 'finance_NASDAQ:GOOGL_price_2024-01-01';
      const data = {
        value: 150.50,
        timestamp: new Date().getTime(),
        date: '2024-01-01',
        symbol: 'NASDAQ:GOOGL',
        attribute: 'price'
      };
      l2Cache.setProperty(key, JSON.stringify(data));

      const result = getCachedFinanceData('NASDAQ:GOOGL', 'price', '2024-01-01');
      expect(result).toBe(150.50);

      // Check L1 cache was populated
      const l1Cache = CacheService.getDocumentCache();
      const l1Result = l1Cache.get(key);
      expect(l1Result).not.toBeNull();
    });

    it('should retrieve most recent entry when no date specified', () => {
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 151.00, '2024-01-02');

      const result = getCachedFinanceData('NASDAQ:GOOGL', 'price');
      expect(result).toBe(151.00);
    });

    it('should handle cache expiration', () => {
      const l2Cache = PropertiesService.getDocumentProperties();
      const key = 'finance_NASDAQ:GOOGL_price_2024-01-01';
      const data = {
        value: 150.50,
        timestamp: new Date().getTime() - (25 * 60 * 60 * 1000), // 25 hours ago
        date: '2024-01-01',
        symbol: 'NASDAQ:GOOGL',
        attribute: 'price'
      };
      l2Cache.setProperty(key, JSON.stringify(data));

      const result = getCachedFinanceData('NASDAQ:GOOGL', 'price');
      expect(result).toBeNull();
    });
  });

  describe('setCachedFinanceData', () => {
    it('should store data in both L1 and L2 cache', () => {
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');

      const l1Cache = CacheService.getDocumentCache();
      const l2Cache = PropertiesService.getDocumentProperties();
      const key = 'finance_NASDAQ:GOOGL_price_2024-01-01';

      const l1Data = l1Cache.get(key);
      const l2Data = l2Cache.getProperty(key);

      expect(l1Data).not.toBeNull();
      expect(l2Data).not.toBeNull();

      const parsed = JSON.parse(l2Data);
      expect(parsed.value).toBe(150.50);
      expect(parsed.symbol).toBe('NASDAQ:GOOGL');
      expect(parsed.attribute).toBe('price');
      expect(parsed.date).toBe('2024-01-01');
    });

    it('should normalize symbol to uppercase and attribute to lowercase', () => {
      setCachedFinanceData('nasdaq:googl', 'PRICE', 150.50, '2024-01-01');

      const result = getCachedFinanceData('NASDAQ:GOOGL', 'price', '2024-01-01');
      expect(result).toBe(150.50);
    });
  });

  describe('isCacheExpired', () => {
    it('should return false for recent timestamp', () => {
      const timestamp = new Date().getTime();
      expect(isCacheExpired(timestamp, 1000)).toBe(false);
    });

    it('should return true for old timestamp', () => {
      const timestamp = new Date().getTime() - 2000;
      expect(isCacheExpired(timestamp, 1000)).toBe(true);
    });
  });

  describe('getHistoricalValue', () => {
    it('should return cached historical value', () => {
      setCachedFinanceData('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
      const result = getHistoricalValue('NASDAQ:GOOGL', 'price', '2024-01-01');
      expect(result).toBe(150.50);
    });

    it('should return error message when no historical data exists', () => {
      const result = getHistoricalValue('NASDAQ:GOOGL', 'price', '2024-01-01');
      expect(result).toContain('#N/A (no data for 2024-01-01)');
    });
  });

  describe('runCacheTest', () => {
    it('should pass internal cache test', () => {
      const result = runCacheTest();
      expect(result).toBe('Cache test PASSED');
    });
  });
});

describe('processSingleAttribute', () => {
  beforeEach(() => {
    global.resetMocks();
  });

  it('should cache and return valid value', () => {
    const result = processSingleAttribute('NASDAQ:GOOGL', 'price', 150.50, '2024-01-01');
    expect(result).toBe(150.50);

    const cached = getCachedFinanceData('NASDAQ:GOOGL', 'price', '2024-01-01');
    expect(cached).toBe(150.50);
  });

  it('should handle undefined value', () => {
    const result = processSingleAttribute('NASDAQ:GOOGL', 'price', undefined, '2024-01-01');
    expect(result).toBe('#N/A');
  });

  it('should handle empty string value', () => {
    const result = processSingleAttribute('NASDAQ:GOOGL', 'price', '', '2024-01-01');
    expect(result).toBe('#N/A');
  });
});
