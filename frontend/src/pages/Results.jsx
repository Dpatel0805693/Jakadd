// pages/Results.jsx - Display regression results with charts and AI interpretation
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Download, 
  TrendingUp, 
  BarChart3, 
  Sparkles,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import StatTooltip from '../components/Tooltip';

export default function Results() {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [analysisId]);

  const loadResults = async () => {
    // Mock data for demo
    if (analysisId === 'demo') {
      const mockResults = {
        id: 'demo',
        model_type: 'ols',
        formula: 'mpg ~ hp + wt',
        created_at: new Date().toISOString(),
        tidy: [
          { 
            term: '(Intercept)', 
            estimate: 37.227, 
            'std.error': 1.598, 
            statistic: 23.285, 
            'p.value': 0.000 
          },
          { 
            term: 'hp', 
            estimate: -0.032, 
            'std.error': 0.009, 
            statistic: -3.519, 
            'p.value': 0.001 
          },
          { 
            term: 'wt', 
            estimate: -3.878, 
            'std.error': 0.633, 
            statistic: -6.129, 
            'p.value': 0.000 
          }
        ],
        glance: {
          'r.squared': 0.827,
          'adj.r.squared': 0.815,
          sigma: 2.593,
          statistic: 69.211,
          'p.value': 0.000,
          df: 2,
          nobs: 32
        },
        ai_interpretation: {
          summary: "This regression model effectively predicts miles per gallon (mpg) based on horsepower (hp) and weight (wt) of cars. The results show that both horsepower and weight significantly impact fuel efficiency.",
          model_quality: {
            rating: "excellent",
            explanation: "The R² value of 0.827 indicates that 82.7% of the variation in mpg is explained by the model. All predictors are statistically significant (p < 0.05)."
          },
          key_findings: [
            "For every additional unit of horsepower, mpg decreases by 0.032 units (holding weight constant)",
            "For every 1000 lb increase in weight, mpg decreases by 3.878 units (holding horsepower constant)",
            "The intercept of 37.227 represents the expected mpg when both hp and wt are zero (theoretical baseline)"
          ],
          recommendations: [
            "The model shows strong predictive power and can be used for forecasting",
            "Both variables are important - consider their interaction effects in future models",
            "Weight has a stronger effect than horsepower on fuel efficiency"
          ]
        },
        residuals: [
          { fitted: 21.5, residual: -0.5 },
          { fitted: 21.2, residual: -0.2 },
          { fitted: 23.1, residual: -0.3 },
          { fitted: 20.8, residual: 0.6 },
          { fitted: 18.4, residual: 0.3 },
          { fitted: 18.3, residual: -0.2 },
          { fitted: 13.9, residual: 0.4 },
          { fitted: 24.6, residual: -0.2 },
          { fitted: 23.2, residual: -0.4 },
          { fitted: 19.1, residual: 0.1 }
        ]
      };
      
      setResults(mockResults);
      setLoading(false);
      return;
    }

    // TODO: Real API call
    setLoading(false);
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_${analysisId}_results.json`;
    link.click();
  };

  const downloadCSV = () => {
    if (!results?.tidy) return;
    
    const headers = ['Term', 'Estimate', 'Std Error', 'Statistic', 'P-Value'];
    const rows = results.tidy.map(row => [
      row.term,
      row.estimate,
      row['std.error'],
      row.statistic,
      row['p.value']
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_${analysisId}_coefficients.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-300">Results not found</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Analysis Results
              </h1>
              <p className="text-gray-400 mt-1">
                {results.formula} • {results.model_type.toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={downloadCSV} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button onClick={downloadResults} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>

        {/* Model Quality Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              results.ai_interpretation.model_quality.rating === 'excellent' 
                ? 'bg-green-500/20' 
                : 'bg-yellow-500/20'
            }`}>
              <CheckCircle className={`w-8 h-8 ${
                results.ai_interpretation.model_quality.rating === 'excellent'
                  ? 'text-green-400'
                  : 'text-yellow-400'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">
                Model Quality: <span className="capitalize text-green-400">
                  {results.ai_interpretation.model_quality.rating}
                </span>
              </h3>
              <p className="text-gray-300">
                {results.ai_interpretation.model_quality.explanation}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Model Statistics */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Model Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(results.glance).map(([key, value]) => (
                <div key={key} className="bg-slate-700/30 rounded-lg p-4">
                  <StatTooltip term={key} value={value}>
                    <p className="text-sm text-gray-400 mb-1">
                      {key.replace(/\./g, ' ').toUpperCase()}
                    </p>
                  </StatTooltip>
                  <p className="text-2xl font-bold">
                    {typeof value === 'number' ? value.toFixed(4) : value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Coefficient Plot */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Coefficient Estimates
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={results.tidy.filter(d => d.term !== '(Intercept)')}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="term" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="estimate" radius={[8, 8, 0, 0]}>
                  {results.tidy.filter(d => d.term !== '(Intercept)').map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.estimate > 0 ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Coefficients Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <h3 className="text-xl font-semibold mb-4">Regression Coefficients</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-600">
                <tr>
                  <th className="text-left py-3 px-4">Term</th>
                  <th className="text-right py-3 px-4">
                    <StatTooltip term="estimate">
                      <span className="cursor-help">Estimate</span>
                    </StatTooltip>
                  </th>
                  <th className="text-right py-3 px-4">
                    <StatTooltip term="std.error">
                      <span className="cursor-help">Std. Error</span>
                    </StatTooltip>
                  </th>
                  <th className="text-right py-3 px-4">
                    <StatTooltip term="t.statistic">
                      <span className="cursor-help">t-Statistic</span>
                    </StatTooltip>
                  </th>
                  <th className="text-right py-3 px-4">
                    <StatTooltip term="p.value">
                      <span className="cursor-help">P-Value</span>
                    </StatTooltip>
                  </th>
                  <th className="text-center py-3 px-4">Significance</th>
                </tr>
              </thead>
              <tbody>
                {results.tidy.map((row, i) => (
                  <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-mono">{row.term}</td>
                    <td className="text-right py-3 px-4 font-semibold">
                      {row.estimate.toFixed(4)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-400">
                      {row['std.error']?.toFixed(4)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-400">
                      {row.statistic?.toFixed(4)}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${
                      row['p.value'] < 0.001 ? 'text-green-400' :
                      row['p.value'] < 0.05 ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {row['p.value'] < 0.001 ? '< 0.001' : row['p.value']?.toFixed(4)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {row['p.value'] < 0.001 && '***'}
                      {row['p.value'] >= 0.001 && row['p.value'] < 0.01 && '**'}
                      {row['p.value'] >= 0.01 && row['p.value'] < 0.05 && '*'}
                      {row['p.value'] >= 0.05 && row['p.value'] < 0.1 && '.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-2">
              Significance codes: 0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
            </p>
          </div>
        </motion.div>

        {/* Residuals Plot */}
        {results.residuals && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card mb-6"
          >
            <h3 className="text-xl font-semibold mb-4">Residual Plot</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="fitted" 
                  name="Fitted Values"
                  stroke="#94a3b8"
                  label={{ value: 'Fitted Values', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="residual" 
                  name="Residuals"
                  stroke="#94a3b8"
                  label={{ value: 'Residuals', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px'
                  }}
                />
                <Scatter data={results.residuals} fill="#8b5cf6" />
                <Line 
                  type="monotone" 
                  dataKey={() => 0} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* AI Interpretation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold">AI Interpretation</h3>
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-400">Summary</h4>
            <p className="text-gray-300 leading-relaxed">
              {results.ai_interpretation.summary}
            </p>
          </div>

          {/* Key Findings */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-green-400">Key Findings</h4>
            <ul className="space-y-2">
              {results.ai_interpretation.key_findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{finding}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="font-semibold mb-3 text-yellow-400">Recommendations</h4>
            <ul className="space-y-2">
              {results.ai_interpretation.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}