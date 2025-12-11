// chartStyles.js
// ----------------------------------------------------------------------------
// Centralized style definitions and utility formatters for all charts.
// Keeps color scheme and layout consistent across visualizations.
export const chartColors = {
  primary: '#3B82F6',    // Blue for data points
  secondary: '#10B981',  // Green for highlights
  negative: '#EF4444',   // Red for error lines or negatives
  neutral: '#9CA3AF',    // Gray for neutral bars
  background: '#FFFFFF', // White background
  grid: '#E5E7EB'        // Light grid lines
};

export const chartConfig = {
  margin: { top: 20, right: 30, bottom: 60, left: 60 },
  cartesianGrid: { strokeDasharray: '3 3', stroke: '#E5E7EB' },
  tooltip: {
    contentStyle: {
      backgroundColor: 'white',
      border: `1px solid #E5E7EB`,
      borderRadius: '4px',
      padding: '10px'
    }
  },
  axis: {
    style: {
      fontSize: 12,
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
    }
  }
};

// Numeric formatters used by tooltips and labels
export const formatters = {
  number: (v) => (typeof v === 'number' ? (Number.isInteger(v) ? v.toString() : v.toFixed(3)) : v),
  percentage: (v) => `${(v * 100).toFixed(1)}%`,
  pValue: (v) => (v < 0.001 ? '<0.001' : v.toFixed(4))
};
