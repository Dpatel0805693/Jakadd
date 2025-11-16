// utils/costTracker.js - Track OpenAI API spending
// Enforces $10/month budget

const fs = require('fs');
const path = require('path');

const COSTS_FILE = path.join(__dirname, '..', 'costs.json');
const MONTHLY_BUDGET = parseFloat(process.env.MONTHLY_BUDGET || 10);

// Load costs from file
function loadCosts() {
  try {
    if (fs.existsSync(COSTS_FILE)) {
      const data = fs.readFileSync(COSTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading costs:', error);
  }
  
  return {
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    total: 0,
    requests: []
  };
}

// Save costs to file
function saveCosts(costs) {
  try {
    fs.writeFileSync(COSTS_FILE, JSON.stringify(costs, null, 2));
  } catch (error) {
    console.error('Error saving costs:', error);
  }
}

// Reset if new month
function resetIfNewMonth(costs) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  if (costs.month !== currentMonth) {
    console.log(`📅 New month detected. Resetting budget from ${costs.month} to ${currentMonth}`);
    return {
      month: currentMonth,
      total: 0,
      requests: []
    };
  }
  
  return costs;
}

// Track a request
function trackRequest(cost) {
  let costs = loadCosts();
  costs = resetIfNewMonth(costs);
  
  costs.total += cost;
  costs.requests.push({
    timestamp: new Date().toISOString(),
    cost: cost
  });
  
  saveCosts(costs);
  
  console.log(`💰 Request cost: $${cost.toFixed(4)} | Total this month: $${costs.total.toFixed(4)}`);
  
  return costs.total;
}

// Check if we can make a request
function canMakeRequest() {
  let costs = loadCosts();
  costs = resetIfNewMonth(costs);
  
  return costs.total < MONTHLY_BUDGET;
}

// Get monthly spending
function getMonthlySpending() {
  let costs = loadCosts();
  costs = resetIfNewMonth(costs);
  
  return parseFloat(costs.total.toFixed(4));
}

// Get remaining budget
function getRemainingBudget() {
  const spent = getMonthlySpending();
  return parseFloat((MONTHLY_BUDGET - spent).toFixed(4));
}

// Get monthly limit
function getMonthlyLimit() {
  return MONTHLY_BUDGET;
}

module.exports = {
  trackRequest,
  canMakeRequest,
  getMonthlySpending,
  getRemainingBudget,
  getMonthlyLimit
};