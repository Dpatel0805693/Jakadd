import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Table, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile) => {
    setError('');
    
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validTypes.some(type => fileName.endsWith(type));
    
    if (!isValid) {
      setError('Please upload a CSV or Excel file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);

    if (fileName.endsWith('.csv')) {
      const text = await selectedFile.text();
      const lines = text.split('\n').slice(0, 6);
      const rows = lines.map(line => line.split(','));
      setPreview({ type: 'csv', rows });
    } else {
      setPreview({ type: 'excel', name: selectedFile.name });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/configure', { state: { file, fileId: 'demo' } });
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Minimal Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-2xl font-medium text-slate-100 mb-2">Upload Your Data</h1>
          <p className="text-sm text-slate-400">Upload a CSV or Excel file to begin analysis</p>
        </motion.div>

        {/* Upload Area - Clean Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-8"
        >
          
          {!file ? (
            <>
              {/* Drag & Drop Zone - Minimal */}
              <div
                className={`border-2 border-dashed rounded-xl p-16 text-center transition-all ${
                  dragActive 
                    ? 'border-violet-500/50 bg-violet-500/5' 
                    : 'border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-base font-medium text-slate-200 mb-1">
                    Drop your file here
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">or click to browse</p>
                  
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInput}
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-500 transition-colors cursor-pointer"
                  >
                    Choose File
                  </label>

                  <div className="mt-6 flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center">
                      <div className="w-1 h-1 bg-slate-600 rounded-full mr-2"></div>
                      CSV files
                    </div>
                    <div className="flex items-center">
                      <div className="w-1 h-1 bg-slate-600 rounded-full mr-2"></div>
                      Excel files
                    </div>
                    <div className="flex items-center">
                      <div className="w-1 h-1 bg-slate-600 rounded-full mr-2"></div>
                      Max 10MB
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start"
                >
                  <AlertCircle className="h-4 w-4 text-rose-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-rose-300 text-xs">{error}</p>
                </motion.div>
              )}
            </>
          ) : (
            <>
              {/* File Selected - Minimal Display */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-5 mb-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      {preview?.type === 'csv' ? (
                        <FileText className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Table className="h-5 w-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-slate-200 mb-1">{file.name}</h3>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="text-slate-500 hover:text-slate-300 transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
              </motion.div>

              {/* Preview - Clean Table */}
              {preview && preview.type === 'csv' && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <h3 className="text-xs font-medium text-slate-400 mb-3">Preview</h3>
                  <div className="overflow-x-auto bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                    <table className="w-full text-xs">
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i} className={i === 0 ? 'font-medium text-slate-300' : 'text-slate-400'}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-3 py-2 border-b border-slate-700/30">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-slate-500 mt-2">Showing first 5 rows</p>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons - Minimal */}
              <div className="flex justify-between items-center">
                <button
                  onClick={resetUpload}
                  className="px-4 py-2 border border-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Upload Different File
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-500 transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue →
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>

        {/* Workflow Steps - Minimal */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mt-8"
        >
          <WorkflowStep number="1" title="Upload" active />
          <WorkflowStep number="2" title="Configure" />
          <WorkflowStep number="3" title="Analyze" />
        </motion.div>

      </div>
    </div>
  );
}

// Minimal Workflow Step
function WorkflowStep({ number, title, active = false }) {
  return (
    <div className="text-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-medium ${
        active 
          ? 'bg-violet-600 text-white' 
          : 'bg-slate-800 text-slate-500'
      }`}>
        {number}
      </div>
      <p className={`text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>{title}</p>
    </div>
  );
}