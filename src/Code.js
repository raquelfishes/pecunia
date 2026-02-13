/**
 * 
 * https://github.com/demmings/cachefinance/blob/main/README.md
 * 
 * https://dividendhistory.org/payout/MSCI/
 * https://stockanalysis.com/stocks/msci/dividend/
 * https://stockanalysis.com/quote/ams/ASML/dividend/
 * 
 * https://www.alphavantage.co/
 * https://finlight.me/pricing
 * https://marketstack.com/pricing
 * 
 */

/**
 * Enhanced GOOGLEFINANCE wrapper with caching support.
 * Stores values in cache for when GoogleFinance returns N/A, ERROR, or for historical data.
 * 
 * @param {string} symbol - Stock ticker with exchange (e.g. "NASDAQ:GOOGL", "NYSEARCA:VOO")
 * @param {string} attributes - Single attribute or comma-separated list (e.g. "price" or "price,volume,name")
 * @param {any} googleFinanceValues - The actual GOOGLEFINANCE result(s). Can be single value or array.
 *                                    If N/A or ERROR, will use cached value instead.
 * @param {string} date - Optional. Date in YYYY-MM-DD format. Defaults to today.
 * @param {string} cmdOption - Optional. For backdoor commands: "SET", "GET", "REMOVE", 
 *                             "CLEARCACHE", "EXPIRECACHE", "?", "HISTORY", etc.
 * @returns {any} Cached value, fresh value, historical value, or N/A if unavailable
 * @customfunction
 */


function PECUNIA(symbol, attributes = 'price', googleFinanceValues = '', date = '', cmdOption = '') {
  // Handle backdoor commands (check this BEFORE validating symbol/attributes)
  // If cmdOption is provided OR googleFinanceValues looks like a command (uppercase alphabetic string), treat it as a command
  const isCommand = cmdOption ||
                    (typeof googleFinanceValues === 'string' &&
                     googleFinanceValues !== '' &&
                     /^[A-Z?]+$/.test(googleFinanceValues)); // All uppercase letters or ?

  if (isCommand) {
    return handleCacheCommand(symbol, attributes, date, googleFinanceValues, cmdOption);
  }

  // For regular operations, symbol and attributes are required
  if (!symbol || !attributes) return '';

  // Use provided date or today's date
  const dateStr = date || new Date().toISOString().split('T')[0];

  // Parse attributes (can be comma-separated)
  const attrArray = String(attributes).split(',').map(a => a.trim());
  const valuesArray = Array.isArray(googleFinanceValues) ? googleFinanceValues : [googleFinanceValues];
  

  // If multiple attributes, process each one
  if (attrArray.length > 1) {
    let results = [];
    for (let i = 0; i < attrArray.length; i++) {
      const attr = attrArray[i];
      const val = valuesArray[i] || '';
      const result = processSingleAttribute(symbol, attr, val, dateStr);
      results.push(result);
    }
    return results;
  }

  // Single attribute
  return processSingleAttribute(symbol, attrArray[0], valuesArray[0], dateStr);
}

function processSingleAttribute(symbol, attribute, googleFinanceValue, dateStr) {
  let valueToUse = googleFinanceValue;
  let isLoading = valueToUse === 'Loading...';
  let useCache = (valueToUse === '#N/A' || valueToUse === '#ERROR!' || valueToUse === '' || valueToUse === undefined);

  // If GoogleFinance is loading, try to use cached value but return "Loading..." if no cache
  if (isLoading) {
    const cachedValue = getCachedFinanceData(symbol, attribute, dateStr);
    if (cachedValue !== null) {
      Logger.log(`PECUNIA: Using cached value while loading ${symbol} ${attribute} (${dateStr}): ${cachedValue}`);
      return cachedValue;
    }
    // Return Loading... so the cell will recalculate when data is ready
    return 'Loading...';
  }

  // If result is N/A or ERROR, try to use cached value
  if (useCache) {
    const cachedValue = getCachedFinanceData(symbol, attribute, dateStr);
    if (cachedValue !== null) {
      Logger.log(`PECUNIA: Using cached value for ${symbol} ${attribute} (${dateStr}): ${cachedValue}`);
      return cachedValue;
    }
    // Return N/A if no cache available
    return '#N/A';
  }

  // Store the good value in cache with the date
  setCachedFinanceData(symbol, attribute, valueToUse, dateStr);
  return valueToUse;
}

/**
 * Cache management with two-tier system:
 * L1 (Fast): CacheService - in-memory, ~5MB, expires after 6 hours
 * L2 (Slow): PropertiesService - persistent, ~9MB, survives sessions
 * 
 * Data format: finance_symbol_attribute_date = {value, timestamp, date}
 */
function getCachedFinanceData(symbol, attribute, dateStr = null) {
  const l1Cache = CacheService.getDocumentCache();
  const l2Cache = PropertiesService.getDocumentProperties();
  
  // If specific date requested, get that exact entry
  if (dateStr) {
    const key = `finance_${symbol.toUpperCase()}_${attribute.toLowerCase()}_${dateStr}`;
    
    // Check L1 (fast) cache first
    let cached = l1Cache.get(key);
    if (cached) {
      Logger.log(`L1 cache HIT: ${key}`);
      return JSON.parse(cached).value;
    }
    
    // Check L2 (slow) cache
    cached = l2Cache.getProperty(key);
    if (cached) {
      Logger.log(`L2 cache HIT: ${key}`);
      try {
        const data = JSON.parse(cached);
        // Promote to L1 cache for faster future access
        l1Cache.put(key, cached, 21600); // 6 hours
        return data.value;
      } catch (e) {
        Logger.log(`Cache read error for ${key}: ${e}`);
        return null;
      }
    }
    return null;
  }

  // Get the most recent entry (no specific date requested)
  const pattern = `finance_${symbol.toUpperCase()}_${attribute.toLowerCase()}_`;
  const keys = l2Cache.getKeys().filter(k => k.startsWith(pattern));
  
  if (keys.length === 0) return null;
  
  // Sort by date descending and get the most recent
  const sortedKeys = keys.sort().reverse();
  const latest = sortedKeys[0];
  
  // Check L1 cache first
  let cached = l1Cache.get(latest);
  if (cached) {
    Logger.log(`L1 cache HIT: ${latest}`);
    return JSON.parse(cached).value;
  }
  
  // Check L2 cache
  cached = l2Cache.getProperty(latest);
  if (cached) {
    Logger.log(`L2 cache HIT: ${latest}`);
    try {
      const data = JSON.parse(cached);
      // Check if cache is expired (24 hours in L2)
      if (isCacheExpired(data.timestamp, 24 * 60 * 60 * 1000)) {
        l2Cache.deleteProperty(latest);
        return null;
      }
      // Promote to L1 cache
      l1Cache.put(latest, cached, 21600); // 6 hours
      return data.value;
    } catch (e) {
      Logger.log(`Cache read error for ${latest}: ${e}`);
      return null;
    }
  }
  
  return null;
}

function setCachedFinanceData(symbol, attribute, value, dateStr) {
  const l1Cache = CacheService.getDocumentCache();
  const l2Cache = PropertiesService.getDocumentProperties();
  
  const key = `finance_${symbol.toUpperCase()}_${attribute.toLowerCase()}_${dateStr}`;
  
  try {
    const data = {
      value: value,
      timestamp: new Date().getTime(),
      date: dateStr,
      symbol: symbol,
      attribute: attribute
    };
    const dataStr = JSON.stringify(data);
    
    // Store in both L1 and L2 cache
    l1Cache.put(key, dataStr, 21600); // L1: 6 hours
    l2Cache.setProperty(key, dataStr); // L2: persistent
    
    Logger.log(`Cached (L1+L2): ${key} = ${value}`);
  } catch (e) {
    Logger.log(`Cache write error for ${key}: ${e}`);
  }
}

function getHistoricalValue(symbol, attribute, dateStr) {
  const cachedValue = getCachedFinanceData(symbol, attribute, dateStr);
  if (cachedValue !== null) {
    return cachedValue;
  }
  return `#N/A (no data for ${dateStr})`;
}

function isCacheExpired(timestamp, maxAgeMs) {
  return (new Date().getTime() - timestamp) > maxAgeMs;
}

/**
 * Handle special cache commands accessed via the function parameters
 */
function handleCacheCommand(symbol, attribute, date, command, cmdOption) {
  const cmd = String(command).toUpperCase();
  const dateStr = date || new Date().toISOString().split('T')[0];

  switch (cmd) {
  case '?':
    return 'Commands: SET, GET, REMOVE, LIST, HISTORY, CLEARCACHE, EXPIRECACHE, TEST';

  case 'SET': {
    if (cmdOption) {
      setCachedFinanceData(symbol, attribute, cmdOption, dateStr);
      return `Set ${symbol} ${attribute} = ${cmdOption}`;
    }
    return 'SET requires a value in cmdOption';
  }

  case 'GET': {
    const value = getCachedFinanceData(symbol, attribute, dateStr);
    return value !== null ? value : 'No cache found';
  }

  case 'HISTORY':
    return getHistory(symbol, attribute, cmdOption);

  case 'REMOVE': {
    const l1CacheRemove = CacheService.getDocumentCache();
    const l2CacheRemove = PropertiesService.getDocumentProperties();
    const key = `finance_${symbol.toUpperCase()}_${attribute.toLowerCase()}`;
    // Remove all date variations of this symbol/attribute from both caches
    const pattern = key + '_';
    const keysToDelete = l2CacheRemove.getKeys().filter(k => k.startsWith(pattern));
    keysToDelete.forEach(k => {
      l2CacheRemove.deleteProperty(k);
      l1CacheRemove.remove(k);
    });
    return `Removed ${keysToDelete.length} cache entries for ${symbol} ${attribute}`;
  }

  case 'LIST':
    return listAllCachedValues();

  case 'CLEARCACHE': {
    const l1CacheClear = CacheService.getDocumentCache();
    const l2CacheClear = PropertiesService.getDocumentProperties();
    l2CacheClear.deleteAllProperties();
    l1CacheClear.removeAll();
    return 'All cache cleared';
  }

  case 'EXPIRECACHE':
    expireOldCacheEntries(24 * 60 * 60 * 1000); // 24 hours
    return 'Old cache entries expired';

  case 'TEST':
    return runCacheTest();

  default:
    return "Unknown command. Use '?' for help.";
  }
}

function getHistory(symbol, attribute) {
  const cache = PropertiesService.getDocumentProperties();
  const pattern = `finance_${symbol.toUpperCase()}_${attribute.toLowerCase()}_`;
  const keys = cache.getKeys().filter(k => k.startsWith(pattern));
  
  if (keys.length === 0) return `No history for ${symbol} ${attribute}`;
  
  let result = `History for ${symbol} ${attribute}:\n`;
  
  // Sort by date descending
  keys.sort().reverse().forEach(key => {
    try {
      const data = JSON.parse(cache.getProperty(key));
      result += `${data.date}: ${data.value}\n`;
    } catch (e) {
      result += `${key}: [error]\n`;
    }
  });
  
  return result;
}

function listAllCachedValues() {
  const cache = PropertiesService.getDocumentProperties();
  const keys = cache.getKeys();
  const financeKeys = keys.filter(k => k.startsWith('finance_'));
  
  if (financeKeys.length === 0) return 'No cached finance data';
  
  let result = 'Cached Finance Data:\n';
  financeKeys.forEach(key => {
    try {
      const data = JSON.parse(cache.getProperty(key));
      const age = ((new Date().getTime() - data.timestamp) / 1000 / 60).toFixed(1);
      result += `${key}: ${data.value} (${age} min old)\n`;
    } catch (e) {
      result += `${key}: [error reading]\n`;
    }
  });
  return result;
}

function expireOldCacheEntries(maxAgeMs) {
  const l1Cache = CacheService.getDocumentCache();
  const l2Cache = PropertiesService.getDocumentProperties();
  const keys = l2Cache.getKeys();
  const now = new Date().getTime();
  let expiredCount = 0;
  
  keys.filter(k => k.startsWith('finance_')).forEach(key => {
    try {
      const data = JSON.parse(l2Cache.getProperty(key));
      if ((now - data.timestamp) > maxAgeMs) {
        l2Cache.deleteProperty(key);
        l1Cache.remove(key); // Also remove from L1 if present
        expiredCount++;
      }
    } catch (e) {
      // Skip on error
    }
  });
  
  Logger.log(`Expired ${expiredCount} old cache entries`);
}

function runCacheTest() {
  // Test cache functionality
  setCachedFinanceData('TEST:SYMBOL', 'price', 123.45);
  const retrieved = getCachedFinanceData('TEST:SYMBOL', 'price');
  const success = retrieved === 123.45;

  if (success) {
    getCachedFinanceData('TEST:SYMBOL', 'price'); // cleanup is automatic on next run
  }

  return success ? 'Cache test PASSED' : 'Cache test FAILED';
}

// Export for testing (Node.js only, ignored by Apps Script)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PECUNIA,
    processSingleAttribute,
    getCachedFinanceData,
    setCachedFinanceData,
    getHistoricalValue,
    isCacheExpired,
    handleCacheCommand,
    getHistory,
    listAllCachedValues,
    expireOldCacheEntries,
    runCacheTest
  };
}
