// utils/cache.js - LRU Cache for AI Gateway
// Reduces API calls and costs

const { LRUCache } = require('lru-cache');

// Cache configuration
const cache = new LRUCache({
  max: 100,  // Maximum 100 entries
  ttl: 1000 * 60 * 60,  // 1 hour TTL (from .env)
  updateAgeOnGet: true,
  updateAgeOnHas: false,
});

// Get cache statistics
function getStats() {
  return {
    size: cache.size,
    max: cache.max,
    ttl: cache.ttl,
    hits: cache.calculatedSize || 0
  };
}

// Get value from cache
function get(key) {
  return cache.get(key);
}

// Set value in cache
function set(key, value) {
  cache.set(key, value);
}

// Clear cache
function clear() {
  cache.clear();
}

// Check if key exists
function has(key) {
  return cache.has(key);
}

module.exports = {
  get,
  set,
  clear,
  has,
  getStats
};