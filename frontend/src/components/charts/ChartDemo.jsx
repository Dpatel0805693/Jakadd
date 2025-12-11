// ============================================================================
// ChartDemo.jsx
// ----------------------------------------------------------------------------
/* PURPOSE:
   A standalone demo page to visually verify the three charts
   before integrating into Results.jsx (recommended in guide).  */
/* Location and usage suggested in guide.   */
import { RegressionPlot, CoefficientPlot, ResidualsPlot } from './index';

const sampleData = {
  regression: {
    actual: [10, 20, 30, 40, 50],
    predicted: [12, 19, 32, 38, 51]
  },
  coefficients: [
    { variable: 'Intercept',  estimate: 5.2,  std_error: 1.1,  p_value: 0.001 },
    { variable: 'Education',  estimate: 2.5,  std_error: 0.8,  p_value: 0.003 },
    { variable: 'Age',        estimate: -0.3, std_error: 0.15, p_value: 0.045 },
    { variable: 'Gender',     estimate: 1.2,  std_error: 0.9,  p_value: 0.18 }
  ],
  residuals: {
    fitted: [12, 19, 32, 38, 51],
    residuals: [-2, 1, -2, 2, -1]
  }
};

export default function ChartDemo() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Chart Components Demo</h1>

      <section>
        <h2>Regression Plot</h2>
        <RegressionPlot data={sampleData.regression} />
      </section>

      <section>
        <h2>Coefficient Plot</h2>
        <CoefficientPlot coefficients={sampleData.coefficients} />
      </section>

      <section>
        <h2>Residuals Plot</h2>
        <ResidualsPlot data={sampleData.residuals} />
      </section>
    </div>
  );
}
