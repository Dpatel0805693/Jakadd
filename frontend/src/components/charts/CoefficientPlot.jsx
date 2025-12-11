// ============================================================================
// CoefficientPlot.jsx
// ----------------------------------------------------------------------------
// • Bar chart of regression coefficients ± 95% confidence intervals
// • Colors indicate sign and significance
// ============================================================================
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { chartColors, chartConfig, formatters } from './chartStyles';
import './charts.css';

export default function CoefficientPlot({ coefficients }) {
  if (!coefficients || coefficients.length === 0) {
    return <div className="chart-error">No coefficient data available</div>;
  }

  // Transform coefficients to plotting format with CI bounds
  const chartData = coefficients.map((c) => ({
    variable: c.variable,
    estimate: c.estimate,
    lower: c.estimate - 1.96 * c.std_error,
    upper: c.estimate + 1.96 * c.std_error,
    p_value: c.p_value,
    significant: c.p_value < 0.05
  }));

  // Determine bar color based on significance and sign
  const getBarColor = (entry) => {
    if (!entry.significant) return chartColors.neutral;
    return entry.estimate > 0 ? chartColors.primary : chartColors.negative;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ ...chartConfig.margin, bottom: 80 }}>
        <CartesianGrid {...chartConfig.cartesianGrid} />
        <XAxis
          dataKey="variable"
          angle={-45}
          textAnchor="end"
          height={100}
          label={{ value: 'Variables', position: 'insideBottom', offset: -60 }}
          tick={{ ...chartConfig.axis.style }}
        />
        <YAxis
          label={{ value: 'Coefficient Estimate', angle: -90, position: 'insideLeft' }}
          tick={{ ...chartConfig.axis.style }}
        />
        <Tooltip content={<CustomTooltip />} contentStyle={chartConfig.tooltip.contentStyle} />
        <Legend />
        <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
        {/* Bars for coefficient estimates */}
        <Bar dataKey="estimate" name="Coefficient">
          {chartData.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={getBarColor(entry)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Custom tooltip showing confidence intervals and significance
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p><strong>{d.variable}</strong></p>
        <p>Estimate: {formatters.number(d.estimate)}</p>
        <p>95% CI: [{formatters.number(d.lower)}, {formatters.number(d.upper)}]</p>
        <p>P-value: {formatters.pValue(d.p_value)}</p>
        <p>
          {d.significant ? (
            <span style={{ color: '#10B981' }}>✓ Significant (p&lt;0.05)</span>
          ) : (
            <span style={{ color: '#9CA3AF' }}>Not significant</span>
          )}
        </p>
      </div>
    );
  }
  return null;
}
