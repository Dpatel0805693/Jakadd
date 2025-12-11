// src/pages/Configure.jsx
// Variable selection and analysis configuration page

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import apiService from '../services/api';
import Papa from 'papaparse';

const Configure = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fileId: paramFileId } = useParams();
  
  // Get fileId from either route params or location state
  const fileId = paramFileId || location.state?.fileId;
  
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [variableTypes, setVariableTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [dependentVar, setDependentVar] = useState('');
  const [independentVars, setIndependentVars] = useState([]);
  const [modelType, setModelType] = useState('auto');

  useEffect(() => {
    if (!fileId) {
      setError('No file selected');
      setLoading(false);
      return;
    }
    loadFileData();
  }, [fileId]);

  const loadFileData = async () => {
    try {
      setLoading(true);
      
      // Get file metadata
      const fileData = await apiService.getFile(fileId);
      setFile(fileData.file);
      
      // Download and parse the file
      const blob = await apiService.downloadFile(fileId);
      const text = await blob.text();
      
      // Parse CSV
      Papa.parse(text, {
        complete: (results) => {
          const parsedData = results.data.filter(row => 
            row.some(cell => cell !== null && cell !== '')
          );
          
          if (parsedData.length > 0) {
            const headers = parsedData[0];
            const dataRows = parsedData.slice(1, 11); // First 10 rows for preview
            
            setHeaders(headers);
            setData(dataRows);
            
            // Detect variable types
            const types = detectVariableTypes(headers, parsedData.slice(1));
            setVariableTypes(types);
          }
          
          setLoading(false);
        },
        error: (error) => {
          setError('Failed to parse file: ' + error.message);
          setLoading(false);
        }
      });
      
    } catch (err) {
      setError(err.message || 'Failed to load file');
      setLoading(false);
    }
  };

  const detectVariableTypes = (headers, dataRows) => {
    const types = {};
    
    headers.forEach((header, index) => {
      // Sample first 100 rows
      const sample = dataRows.slice(0, 100).map(row => row[index]);
      
      // Count numeric values
      const numericCount = sample.filter(val => 
        val !== '' && val !== null && !isNaN(val)
      ).length;
      
      // If more than 80% are numeric, consider it numeric
      const isNumeric = numericCount / sample.length > 0.8;
      
      types[header] = isNumeric ? 'numeric' : 'categorical';
    });
    
    return types;
  };

  const handleDependentVarChange = (e) => {
    setDependentVar(e.target.value);
  };

  const handleIndependentVarToggle = (variable) => {
    setIndependentVars(prev => {
      if (prev.includes(variable)) {
        return prev.filter(v => v !== variable);
      } else {
        return [...prev, variable];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!dependentVar) {
      alert('Please select a dependent variable');
      return;
    }
    
    if (independentVars.length === 0) {
      alert('Please select at least one independent variable');
      return;
    }
    
    if (independentVars.includes(dependentVar)) {
      alert('Dependent variable cannot also be an independent variable');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Submit analysis request
      const result = await apiService.createAnalysis(
        fileId,
        dependentVar,
        independentVars,
        modelType
      );
      
      // Navigate to results page
      if (result.jobId || result.analysisId) {
        navigate(`/results/${result.jobId || result.analysisId}`);
      }else {
        alert('Analysis started but no ID returned');
      }
      
    } catch (err) {
      alert(err.message || 'Failed to start analysis');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading file data...</p>
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

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <h2 style={styles.title}>Configure Analysis: {file?.originalName}</h2>
      </div>

      {/* Main Content - Split Screen */}
      <div style={styles.mainContent}>
        {/* Left Panel - Configuration */}
        <div style={styles.leftPanel}>
          <div style={styles.configSection}>
            <h3 style={styles.sectionTitle}>🎯 Select Variables</h3>
            
            {/* Dependent Variable */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Dependent Variable (Outcome)
                <span style={styles.tooltip} title="The variable you want to predict or explain">ℹ️</span>
              </label>
              <select 
                style={styles.select}
                value={dependentVar}
                onChange={handleDependentVarChange}
              >
                <option value="">-- Select Dependent Variable --</option>
                {headers.map(header => (
                  <option key={header} value={header}>
                    {header} ({variableTypes[header]})
                  </option>
                ))}
              </select>
            </div>

            {/* Independent Variables */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Independent Variables (Predictors)
                <span style={styles.tooltip} title="Variables used to predict the dependent variable">ℹ️</span>
              </label>
              <div style={styles.checkboxContainer}>
                {headers.map(header => (
                  <label 
                    key={header} 
                    style={{
                      ...styles.checkboxLabel,
                      ...(header === dependentVar ? styles.disabledCheckbox : {})
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={independentVars.includes(header)}
                      onChange={() => handleIndependentVarToggle(header)}
                      disabled={header === dependentVar}
                      style={styles.checkbox}
                    />
                    <span style={styles.checkboxText}>
                      {header}
                      <span style={styles.varType}>({variableTypes[header]})</span>
                    </span>
                  </label>
                ))}
              </div>
              <div style={styles.selectedCount}>
                Selected: {independentVars.length} variable{independentVars.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Model Type */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Model Type
                <span style={styles.tooltip} title="Statistical model to use for analysis">ℹ️</span>
              </label>
              <select 
                style={styles.select}
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
              >
                <option value="auto">Auto-detect (Recommended)</option>
                <option value="ols">OLS Regression (Continuous outcome)</option>
                <option value="logistic">Logistic Regression (Binary outcome)</option>
              </select>
              <div style={styles.hint}>
                Auto-detect will choose the best model based on your dependent variable
              </div>
            </div>

            {/* Submit Button */}
            <button 
              style={{
                ...styles.submitButton,
                ...(submitting ? styles.submitButtonDisabled : {})
              }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '⏳ Running Analysis...' : '🚀 Run Analysis'}
            </button>
          </div>
        </div>

        {/* Right Panel - Data Preview */}
        <div style={styles.rightPanel}>
          <h3 style={styles.sectionTitle}>📊 Data Preview</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {headers.map(header => (
                    <th key={header} style={styles.th}>
                      <div style={styles.headerCell}>
                        <span>{header}</span>
                        <span style={styles.typeBadge}>
                          {variableTypes[header] === 'numeric' ? '🔢' : '📝'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={styles.tr}>
                    {row.map((cell, j) => (
                      <td key={j} style={styles.td}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={styles.previewNote}>
            Showing first {data.length} rows of {file?.originalName}
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
  },
  mainContent: {
    display: 'flex',
    height: 'calc(100vh - 84px)',
  },
  leftPanel: {
    flex: '0 0 500px',
    backgroundColor: '#1a1a1a',
    borderRight: '2px solid #333',
    overflowY: 'auto',
    padding: '30px',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    overflowY: 'auto',
    padding: '30px',
  },
  configSection: {
    maxWidth: '100%',
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#00ff00',
    borderBottom: '2px solid #333',
    paddingBottom: '10px',
  },
  formGroup: {
    marginBottom: '30px',
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ddd',
  },
  tooltip: {
    marginLeft: '8px',
    cursor: 'help',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#222',
    color: '#fff',
    border: '2px solid #444',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  checkboxContainer: {
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: '#222',
    border: '2px solid #444',
    borderRadius: '8px',
    padding: '15px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    marginBottom: '5px',
  },
  disabledCheckbox: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  checkbox: {
    marginRight: '10px',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '14px',
    color: '#ddd',
  },
  varType: {
    marginLeft: '8px',
    fontSize: '12px',
    color: '#888',
  },
  selectedCount: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#00ff00',
    fontWeight: '600',
  },
  hint: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic',
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#00ff00',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
    cursor: 'not-allowed',
  },
  tableWrapper: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 250px)',
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '1px solid #333',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#222',
    color: '#00ff00',
    fontWeight: '600',
    position: 'sticky',
    top: 0,
    borderBottom: '2px solid #444',
    zIndex: 10,
  },
  headerCell: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    fontSize: '16px',
  },
  tr: {
    borderBottom: '1px solid #333',
  },
  td: {
    padding: '10px 12px',
    color: '#ddd',
    fontSize: '14px',
  },
  previewNote: {
    marginTop: '15px',
    fontSize: '14px',
    color: '#888',
    textAlign: 'center',
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

export default Configure;