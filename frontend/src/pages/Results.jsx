// src/pages/Results.jsx
// Analysis results display with tabbed interface

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/api';
import { CoefficientPlot, RegressionPlot, ResidualsPlot, ChartContainer } from '../components/charts';

const Results = () => {
  const navigate = useNavigate();
  const { analysisId } = useParams();
  
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('interpretation');

  useEffect(() => {
    if (!analysisId) {
      setError('No analysis ID provided');
      setLoading(false);
      return;
    }
    loadAnalysis();
  }, [analysisId]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAnalysis(analysisId);
      if (data.analysis) {
        setAnalysis(data.analysis);
        setLoading(false);
      } else {
        setError('Analysis not found');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to load analysis results');
      setLoading(false);
    }
  };

  const formatCoefficients = (tidy) => {
    if (!tidy || !Array.isArray(tidy)) return null;
    
    return (
      <table style={styles.resultTable}>
        <thead>
          <tr>
            <th style={styles.resultTh}>Term</th>
            <th style={styles.resultTh}>Estimate</th>
            <th style={styles.resultTh}>Std. Error</th>
            <th style={styles.resultTh}>t-value</th>
            <th style={styles.resultTh}>p-value</th>
          </tr>
        </thead>
        <tbody>
          {tidy.map((row, i) => (
            <tr key={i} style={styles.resultTr}>
              <td style={styles.resultTd}>{row.term}</td>
              <td style={styles.resultTd}>{row.estimate?.toFixed(4)}</td>
              <td style={styles.resultTd}>{row['std.error']?.toFixed(4)}</td>
              <td style={styles.resultTd}>{row.statistic?.toFixed(4)}</td>
              <td style={{
                ...styles.resultTd,
                color: row['p.value'] < 0.05 ? '#00ff00' : '#ff6666',
                fontWeight: row['p.value'] < 0.05 ? 'bold' : 'normal'
              }}>
                {row['p.value']?.toFixed(4)}
                {row['p.value'] < 0.05 && ' *'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const formatDiagnostics = (glance) => {
    if (!glance || !Array.isArray(glance) || glance.length === 0) return null;
    
    const stats = glance[0];
    
    return (
      <div style={styles.diagnosticsGrid}>
        {stats.r_squared !== undefined && (
          <div style={styles.statCard}>
            <div style={styles.statLabel}>R²</div>
            <div style={styles.statValue}>{stats.r_squared.toFixed(4)}</div>
            <div style={styles.statHint}>Model fit</div>
          </div>
        )}
        {stats.adj_r_squared !== undefined && (
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Adjusted R²</div>
            <div style={styles.statValue}>{stats.adj_r_squared.toFixed(4)}</div>
            <div style={styles.statHint}>Adjusted fit</div>
          </div>
        )}
        {stats.sigma !== undefined && (
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Residual Std. Error</div>
            <div style={styles.statValue}>{stats.sigma.toFixed(4)}</div>
            <div style={styles.statHint}>Model error</div>
          </div>
        )}
        {stats.statistic !== undefined && (
          <div style={styles.statCard}>
            <div style={styles.statLabel}>F-statistic</div>
            <div style={styles.statValue}>{stats.statistic.toFixed(4)}</div>
            <div style={styles.statHint}>Overall significance</div>
          </div>
        )}
        {stats.p_value !== undefined && (
          <div style={styles.statCard}>
            <div style={styles.statLabel}>p-value</div>
            <div style={{
              ...styles.statValue,
              color: stats.p_value < 0.05 ? '#00ff00' : '#ff6666'
            }}>
              {stats.p_value.toFixed(6)}
            </div>
            <div style={styles.statHint}>Model significance</div>
          </div>
        )}
        {stats.df !== undefined && (
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Degrees of Freedom</div>
            <div style={styles.statValue}>{stats.df}</div>
            <div style={styles.statHint}>Model complexity</div>
          </div>
        )}
      </div>
    );
  };

  // Transform tidy data for CoefficientPlot
  const prepareCoefficientsForChart = (tidy) => {
    if (!tidy || !Array.isArray(tidy)) return [];
    
    return tidy.map(row => ({
      variable: row.term,
      estimate: row.estimate,
      std_error: row['std.error'],
      p_value: row['p.value']
    }));
  };

  // Prepare residuals data if available
  const prepareResidualsData = (results) => {
    if (!results.diagnostics) return null;
    
    return {
      fitted: results.diagnostics.fitted || [],
      residuals: results.diagnostics.residuals || []
    };
  };

  const downloadResults = (analysis) => {
    const content = generateDownloadContent(analysis);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statsmate_results_${analysis._id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateDownloadContent = (analysis) => {
    const { results, interpretation, dependentVar, independentVars, modelType } = analysis;
    
    let content = `STATSMATE ANALYSIS RESULTS\n`;
    content += `${'='.repeat(70)}\n\n`;
    content += `Model Type: ${modelType?.toUpperCase() || 'OLS'} Regression\n`;
    content += `Dependent Variable: ${dependentVar}\n`;
    content += `Independent Variables: ${independentVars?.join(', ')}\n`;
    content += `Analysis Date: ${new Date(analysis.createdAt).toLocaleString()}\n\n`;
    
    // Coefficients
    if (results.tidy && results.tidy.length > 0) {
      content += `COEFFICIENTS\n`;
      content += `${'-'.repeat(70)}\n`;
      content += `${'Term'.padEnd(25)} ${'Estimate'.padStart(12)} ${'Std.Error'.padStart(12)} ${'t-value'.padStart(10)} ${'p-value'.padStart(10)}\n`;
      content += `${'-'.repeat(70)}\n`;
      
      results.tidy.forEach(row => {
        content += `${row.term.padEnd(25)} `;
        content += `${row.estimate.toFixed(4).padStart(12)} `;
        content += `${(row['std.error'] || 0).toFixed(4).padStart(12)} `;
        content += `${(row.statistic || 0).toFixed(4).padStart(10)} `;
        content += `${(row['p.value'] || 0).toFixed(4).padStart(10)}`;
        if (row['p.value'] < 0.05) content += ` *`;
        content += `\n`;
      });
      content += `\n* p < 0.05 (statistically significant)\n\n`;
    }
    
    // Model diagnostics
    if (results.glance) {
      const glance = Array.isArray(results.glance) ? results.glance[0] : results.glance;
      content += `MODEL DIAGNOSTICS\n`;
      content += `${'-'.repeat(70)}\n`;
      if (glance.r_squared !== undefined) {
        content += `R-squared:              ${glance.r_squared.toFixed(4)}\n`;
      }
      if (glance.adj_r_squared !== undefined) {
        content += `Adjusted R-squared:     ${glance.adj_r_squared.toFixed(4)}\n`;
      }
      if (glance.sigma !== undefined) {
        content += `Residual Std. Error:    ${glance.sigma.toFixed(4)}\n`;
      }
      if (glance.statistic !== undefined) {
        content += `F-statistic:            ${glance.statistic.toFixed(4)}\n`;
      }
      if (glance.p_value !== undefined) {
        content += `p-value:                ${glance.p_value.toFixed(6)}\n`;
      }
      content += `\n`;
    }
    
    // Interpretation
    if (interpretation) {
      content += `AI INTERPRETATION\n`;
      content += `${'-'.repeat(70)}\n`;
      content += `${interpretation}\n\n`;
    }
    
    // R Code
    if (results.r_code) {
      content += `R CODE\n`;
      content += `${'-'.repeat(70)}\n`;
      content += `${results.r_code}\n`;
    }
    
    return content;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <h3>Analyzing Your Data...</h3>
        <p>This may take a few moments</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button style={styles.backButton} onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!analysis || !analysis.results) {
    return (
      <div style={styles.errorContainer}>
        <h2>⚠️ No Results</h2>
        <p>Analysis results not available</p>
        <button style={styles.backButton} onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const { results, interpretation } = analysis;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h2 style={styles.title}>Analysis Results</h2>
        <div style={styles.headerInfo}>
          <span style={styles.badge}>
            {analysis.modelType?.toUpperCase() || 'OLS'}
          </span>
          <span style={styles.processingTime}>
            ⏱️ {analysis.processingTime}ms
          </span>
        </div>
      </div>

      {/* Main Content - Split Screen with Tabs */}
      <div style={styles.mainContent}>
        {/* Left Panel - Tabbed Content */}
        <div style={styles.leftPanel}>
          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'interpretation' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('interpretation')}
            >
              💡 AI Interpretation
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'output' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('output')}
            >
              📊 Statistical Output
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'visualizations' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('visualizations')}
            >
              📈 Visualizations
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'code' ? styles.activeTab : {})
              }}
              onClick={() => setActiveTab('code')}
            >
              💻 R Code
            </button>
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>
            {/* Interpretation Tab */}
            {activeTab === 'interpretation' && (
              <div style={styles.interpretationPanel}>
                <h3 style={styles.panelTitle}>Plain-Language Interpretation</h3>
                <div style={styles.interpretationText}>
                  {interpretation || 'No interpretation available'}
                </div>
              </div>
            )}

            {/* Statistical Output Tab */}
            {activeTab === 'output' && (
              <div style={styles.outputPanel}>
                {/* Coefficients Section */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Regression Coefficients</h3>
                  {formatCoefficients(results.tidy)}
                  <p style={styles.note}>* Indicates statistical significance (p &lt; 0.05)</p>
                </div>

                {/* Model Diagnostics */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Model Diagnostics</h3>
                  {formatDiagnostics(results.glance)}
                </div>
              </div>
            )}

            {/* NEW: Visualizations Tab */}
            {activeTab === 'visualizations' && (
              <div style={styles.visualizationsPanel}>
                {/* Coefficient Plot */}
                {results.tidy && results.tidy.length > 0 && (
                  <div style={styles.section}>
                    <ChartContainer 
                      title="Coefficient Estimates with Confidence Intervals"
                      info="Shows regression coefficients with 95% confidence intervals. Green indicates positive significant effects, red indicates negative significant effects, gray indicates non-significant effects."
                    >
                      <CoefficientPlot coefficients={prepareCoefficientsForChart(results.tidy)} />
                    </ChartContainer>
                  </div>
                )}

                {/* Residuals Plot */}
                {prepareResidualsData(results) && (
                  <div style={styles.section}>
                    <ChartContainer 
                      title="Residuals vs Fitted Values"
                      info="Diagnostic plot showing residuals against fitted values. Points should be randomly scattered around the zero line for a good model fit."
                    >
                      <ResidualsPlot data={prepareResidualsData(results)} />
                    </ChartContainer>
                  </div>
                )}
              </div>
            )}

            {/* R Code Tab */}
            {activeTab === 'code' && (
              <div style={styles.codePanel}>
                <h3 style={styles.panelTitle}>R Code Used</h3>
                <pre style={styles.codeBlock}>
                  {results.r_code || 'No R code available'}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Summary Card */}
        <div style={styles.rightPanel}>
          <div style={styles.summaryCard}>
            <h3 style={styles.panelTitle}>Analysis Summary</h3>
            
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Model Type</span>
              <span style={styles.summaryValue}>
                {analysis.modelType?.toUpperCase() || 'OLS'}
              </span>
            </div>
            
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Dependent Variable</span>
              <span style={styles.summaryValue}>{analysis.dependentVar}</span>
            </div>
            
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Independent Variables</span>
              <span style={styles.summaryValue}>
                {analysis.independentVars?.join(', ')}
              </span>
            </div>
            
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Status</span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: '#00ff00'
              }}>
                {analysis.status}
              </span>
            </div>
            
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Processing Time</span>
              <span style={styles.summaryValue}>{analysis.processingTime}ms</span>
            </div>
          </div>

          {/* Key Findings */}
          <div style={styles.keyFindings}>
            <h4 style={styles.findingsTitle}>Key Findings</h4>
            {results.tidy && results.tidy.filter(r => r['p.value'] < 0.05).length > 0 ? (
              results.tidy
                .filter(r => r['p.value'] < 0.05)
                .map((r, i) => (
                  <div key={i} style={styles.finding}>
                    <strong>{r.term}</strong> is statistically significant (p = {r['p.value'].toFixed(4)})
                  </div>
                ))
            ) : (
              <p style={styles.finding}>No statistically significant predictors found</p>
            )}
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              style={styles.actionButton}
              onClick={() => downloadResults(analysis)}
            >
              📥 Download Results
            </button>
            <button
              style={{...styles.actionButton, ...styles.secondaryButton}}
              onClick={() => navigate('/dashboard')}
            >
              🏠 Back to Dashboard
            </button>
            <button
              style={{...styles.actionButton, ...styles.secondaryButton}}
              onClick={() => navigate('/configure')}
            >
              🔄 New Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontFamily: 'Poppins, sans-serif',
  },
  header: {
    backgroundColor: '#1a1a1a',
    borderBottom: '2px solid #00ff00',
    padding: '20px 40px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#00ff00',
    flex: 1,
  },
  headerInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  badge: {
    padding: '6px 12px',
    backgroundColor: '#00ff00',
    color: '#000',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  processingTime: {
    fontSize: '14px',
    color: '#888',
  },
  mainContent: {
    display: 'flex',
    height: 'calc(100vh - 84px)',
  },
  leftPanel: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
  },
  rightPanel: {
    flex: '0 0 400px',
    backgroundColor: '#1a1a1a',
    borderLeft: '2px solid #333',
    overflowY: 'auto',
    padding: '30px',
  },
  tabs: {
    display: 'flex',
    backgroundColor: '#1a1a1a',
    borderBottom: '2px solid #333',
  },
  tab: {
    flex: 1,
    padding: '15px',
    backgroundColor: 'transparent',
    color: '#888',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  activeTab: {
    color: '#00ff00',
    borderBottomColor: '#00ff00',
    backgroundColor: '#0a0a0a',
  },
  tabContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '30px',
  },
  interpretationPanel: {},
  panelTitle: {
    fontSize: '18px',
    marginBottom: '20px',
    color: '#00ff00',
  },
  interpretationText: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#ddd',
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #333',
    whiteSpace: 'pre-wrap',
  },
  codePanel: {},
  codeBlock: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '20px',
    fontSize: '14px',
    fontFamily: 'monospace',
    color: '#00ff00',
    overflowX: 'auto',
    lineHeight: '1.6',
  },
  outputPanel: {},
  visualizationsPanel: {},
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '16px',
    marginBottom: '15px',
    color: '#00ff00',
    borderBottom: '1px solid #333',
    paddingBottom: '8px',
  },
  resultTable: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  resultTh: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#222',
    color: '#00ff00',
    fontWeight: '600',
    borderBottom: '2px solid #333',
  },
  resultTr: {
    borderBottom: '1px solid #333',
  },
  resultTd: {
    padding: '10px 12px',
    color: '#ddd',
    fontSize: '14px',
  },
  note: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic',
  },
  diagnosticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: '5px',
  },
  statHint: {
    fontSize: '11px',
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#222',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333',
  },
  summaryLabel: {
    color: '#888',
    fontSize: '14px',
  },
  summaryValue: {
    color: '#ddd',
    fontSize: '14px',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#000',
  },
  keyFindings: {
    backgroundColor: '#222',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  findingsTitle: {
    fontSize: '16px',
    marginBottom: '15px',
    color: '#00ff00',
  },
  finding: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#ddd',
    marginBottom: '12px',
    paddingLeft: '10px',
    borderLeft: '3px solid #00ff00',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actionButton: {
    padding: '12px',
    backgroundColor: '#00ff00',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: '#333',
    color: '#fff',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontFamily: 'Poppins, sans-serif',
  },
  spinner: {
    border: '4px solid #333',
    borderTop: '4px solid #00ff00',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#0a0a0a',
    color: '#fff',
    fontFamily: 'Poppins, sans-serif',
    textAlign: 'center',
    padding: '40px',
  },
};

export default Results;
