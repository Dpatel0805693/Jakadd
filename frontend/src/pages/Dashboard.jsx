// src/pages/Dashboard.jsx
// Main dashboard for file management and analysis history

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [files, setFiles] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('files'); // 'files' or 'analyses'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesData, analysesData] = await Promise.all([
        apiService.listFiles(),
        apiService.listAnalyses().catch(() => ({ analyses: [] })), // Graceful fallback
      ]);
      
      setFiles(filesData.files || []);
      setAnalyses(analysesData.analyses || []);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.csv', '.xlsx'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExt)) {
      alert('Please upload a CSV or Excel file');
      return;
    }

    try {
      setUploading(true);
      await apiService.uploadFile(file);
      await loadData(); // Refresh file list
      alert('File uploaded successfully!');
    } catch (err) {
      alert(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await apiService.deleteFile(fileId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const handleStartAnalysis = (file) => {
  // Use the id property, not _id
  navigate(`/configure/${file.id || file._id}`);
};

  const handleViewAnalysis = (analysisId) => {
    navigate('/results', { state: { analysisId } });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: '#00ff00',
      pending: '#ffaa00',
      queued: '#00aaff',
      failed: '#ff0000',
    };
    return colors[status] || '#666';
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>📊 StatsMate</h1>
          <div style={styles.userSection}>
            <span style={styles.userName}>👤 {user?.name || user?.email}</span>
            <button style={styles.logoutBtn} onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.contentWrapper}>
          <h2 style={styles.pageTitle}>Dashboard</h2>

          {/* Upload Section */}
          <div style={styles.uploadSection}>
            <label htmlFor="file-upload" style={styles.uploadLabel}>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              <div style={styles.uploadButton}>
                {uploading ? '⏳ Uploading...' : '📤 Upload New Dataset'}
              </div>
            </label>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'files' ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab('files')}
            >
              📁 My Files ({files.length})
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'analyses' ? styles.activeTab : {}),
              }}
              onClick={() => setActiveTab('analyses')}
            >
              📊 Analysis History ({analyses.length})
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.error}>
              ⚠️ {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : (
            <>
              {/* Files Tab */}
              {activeTab === 'files' && (
                <div style={styles.tableContainer}>
                  {files.length === 0 ? (
                    <div style={styles.emptyState}>
                      <p>📂 No files uploaded yet</p>
                      <p style={styles.emptySubtext}>Upload a CSV or Excel file to get started</p>
                    </div>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Filename</th>
                          <th style={styles.th}>Size</th>
                          <th style={styles.th}>Uploaded</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr key={file._id} style={styles.tr}>
                            <td style={styles.td}>📄 {file.originalName}</td>
                            <td style={styles.td}>{formatFileSize(file.size)}</td>
                            <td style={styles.td}>{formatDate(file.createdAt)}</td>
                            <td style={styles.td}>
                              <button
                                style={styles.actionBtn}
                                onClick={() => handleStartAnalysis(file)}
                              >
                                🔬 Analyze
                              </button>
                              <button
                                style={{...styles.actionBtn, ...styles.deleteBtn}}
                                onClick={() => handleDeleteFile(file._id)}
                              >
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Analyses Tab */}
              {activeTab === 'analyses' && (
                <div style={styles.tableContainer}>
                  {analyses.length === 0 ? (
                    <div style={styles.emptyState}>
                      <p>📊 No analyses yet</p>
                      <p style={styles.emptySubtext}>Upload a file and run an analysis to see results here</p>
                    </div>
                  ) : (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Model Type</th>
                          <th style={styles.th}>Variables</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Created</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyses.map((analysis) => (
                          <tr key={analysis._id} style={styles.tr}>
                            <td style={styles.td}>
                              {analysis.modelType?.toUpperCase() || 'AUTO'}
                            </td>
                            <td style={styles.td}>
                              {analysis.dependentVar} ~ {analysis.independentVars?.join(', ')}
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.status,
                                backgroundColor: getStatusColor(analysis.status),
                              }}>
                                {analysis.status}
                              </span>
                            </td>
                            <td style={styles.td}>{formatDate(analysis.createdAt)}</td>
                            <td style={styles.td}>
                              {analysis.status === 'completed' && (
                                <button
                                  style={styles.actionBtn}
                                  onClick={() => handleViewAnalysis(analysis._id)}
                                >
                                  👁️ View Results
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
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
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userName: {
    fontSize: '14px',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#ff3333',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  main: {
    padding: '40px',
  },
  contentWrapper: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '32px',
    marginBottom: '30px',
    color: '#00ff00',
  },
  uploadSection: {
    marginBottom: '30px',
  },
  uploadLabel: {
    cursor: 'pointer',
  },
  uploadButton: {
    display: 'inline-block',
    padding: '15px 30px',
    backgroundColor: '#00ff00',
    color: '#000',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'all 0.3s ease',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #333',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: '#999',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  activeTab: {
    color: '#00ff00',
    borderBottomColor: '#00ff00',
  },
  error: {
    backgroundColor: '#331111',
    color: '#ff6666',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ff3333',
  },
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#999',
  },
  tableContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #333',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    backgroundColor: '#222',
    color: '#00ff00',
    fontWeight: '600',
    borderBottom: '2px solid #333',
  },
  tr: {
    borderBottom: '1px solid #333',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '15px',
    color: '#ddd',
  },
  actionBtn: {
    padding: '6px 12px',
    backgroundColor: '#00ff00',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    marginRight: '8px',
  },
  deleteBtn: {
    backgroundColor: '#ff3333',
    color: '#fff',
  },
  status: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#000',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#666',
  },
};

export default Dashboard;