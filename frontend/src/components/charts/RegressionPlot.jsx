// ============================================================================
// RegressionPlot.jsx
// ----------------------------------------------------------------------------
// • Displays Actual vs Predicted values from regression results
// • Points represent observations; red line = perfect 45° prediction
// • Interactive tooltip and legend included
// ============================================================================
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ResponsiveContainer
} from 'recharts';
import { chartColors, chartConfig, formatters } from './chartStyles';
import './charts.css';

export default function RegressionPlot({ data }) {
  // Guard: ensure valid data
  if (!data || !Array.isArray(data.actual) || !Array.isArray(data.predicted)) {
    return <div className="chart-error">No data available</div>;
  }

  // Combine actual and predicted values into scatter format
  const scatterData = data.actual.map((actual, idx) => ({
    actual,
    predicted: data.predicted[idx],
    name: `Obs ${idx + 1}`
  }));

  // Compute diagonal line (perfect prediction reference)
  const allValues = [...data.actual, ...data.predicted];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const diagonalLine = [
    { actual: minVal, predicted: minVal },
    { actual: maxVal, predicted: maxVal }
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={chartConfig.margin}>
        <CartesianGrid {...chartConfig.cartesianGrid} />
        <XAxis
          type="number"
          dataKey="actual"
          label={{ value: 'Actual Values', position: 'insideBottom', offset: -10 }}
          tick={{ ...chartConfig.axis.style }}
        />
        <YAxis
          type="number"
          dataKey="predicted"
          label={{ value: 'Predicted Values', angle: -90, position: 'insideLeft' }}
          tick={{ ...chartConfig.axis.style }}
        />
        <Tooltip
          formatter={(v) => formatters.number(v)}
          contentStyle={chartConfig.tooltip.contentStyle}
        />
        <Legend />
        {/* Perfect prediction line */}
        <Line
          data={diagonalLine}
          type="monotone"
          dataKey="predicted"
          stroke={chartColors.negative}
          strokeWidth={2}
          dot={false}
          name="Perfect Prediction"
        />
        {/* Observation points */}
        <Scatter name="Observations" data={scatterData} fill={chartColors.primary} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
