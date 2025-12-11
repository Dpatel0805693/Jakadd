// ChartLoading.jsx
// ----------------------------------------------------------------------------
// Simple animated spinner to show while chart data is being fetched.
import './charts.css';

export default function ChartLoading() {
  return (
    <div className="chart-loading">
      <div className="spinner" />
      <p>Loading chart...</p>
    </div>
  );
}
