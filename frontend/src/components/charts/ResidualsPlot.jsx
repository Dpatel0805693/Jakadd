// ============================================================================
// ResidualsPlot.jsx
// ----------------------------------------------------------------------------
// • Scatter of fitted vs residual values for diagnostic checks
// • Horizontal reference line at 0 indicates unbiased residuals
// ============================================================================
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { chartColors, chartConfig, formatters } from './chartStyles';
import './charts.css';

export default function ResidualsPlot({ data }) {
  if (!data || !Array.isArray(data.fitted) || !Array.isArray(data.residuals)) {
    return <div className="chart-error">No residual data available</div>;
  }

  // Combine fitted/residual values
  const residualData = data.fitted.map((fitted, idx) => ({
    fitted,
    residual: data.residuals[idx],
    name: `Obs ${idx + 1}`
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={chartConfig.margin}>
        <CartesianGrid {...chartConfig.cartesianGrid} />
        <XAxis
          type="number"
          dataKey="fitted"
          label={{ value: 'Fitted Values', position: 'insideBottom', offset: -10 }}
          tick={{ ...chartConfig.axis.style }}
        />
        <YAxis
          type="number"
          dataKey="residual"
          label={{ value: 'Residuals', angle: -90, position: 'insideLeft' }}
          tick={{ ...chartConfig.axis.style }}
        />
        <Tooltip formatter={(v) => formatters.number(v)} contentStyle={chartConfig.tooltip.contentStyle} />
        {/* Reference line at 0 residual */}
        <ReferenceLine y={0} stroke={chartColors.negative} strokeWidth={2} />
        {/* Residual points */}
        <Scatter name="Residuals" data={residualData} fill={chartColors.primary} fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
