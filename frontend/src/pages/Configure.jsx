// pages/Configure.jsx - Analysis configuration with split-screen layout
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronRight, ChevronLeft, Code2, FileText, Sparkles } from 'lucide-react';
import apiService from '../services/api';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-r';

export default function Configure() {
  const { fileId } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('code'); // code, output, explain
  const [loading, setLoading] = useState(false);
  
  // Data state
  const [fileData, setFileData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState('ols');
  const [dependentVar, setDependentVar] = useState('');
  const [independentVars, setIndependentVars] = useState([]);
  
  // Results state
  const [rCode, setRCode] = useState('');
  const [output, setOutput] = useState(null);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Load file data
  useEffect(() => {
    loadFileData();
  }, [fileId]);

  const loadFileData = async () => {
    // Use mock data for demo
    if (fileId === 'demo') {
      const mockData = {
        id: 'demo',
        filename: 'mtcars_sample.csv',
        columns: ['mpg', 'hp', 'wt', 'cyl', 'vs'],
        sample: [
          { mpg: 21.0, hp: 110, wt: 2.62, cyl: 6, vs: 0 },
          { mpg: 21.0, hp: 110, wt: 2.875, cyl: 6, vs: 0 },
          { mpg: 22.8, hp: 93, wt: 2.32, cyl: 4, vs: 1 },
          { mpg: 21.4, hp: 110, wt: 3.215, cyl: 6, vs: 1 },
          { mpg: 18.7, hp: 175, wt: 3.44, cyl: 8, vs: 0 },
        ],
        data: [
          { mpg: 21.0, hp: 110, wt: 2.62, cyl: 6, vs: 0 },
          { mpg: 21.0, hp: 110, wt: 2.875, cyl: 6, vs: 0 },
          { mpg: 22.8, hp: 93, wt: 2.32, cyl: 4, vs: 1 },
          { mpg: 21.4, hp: 110, wt: 3.215, cyl: 6, vs: 1 },
          { mpg: 18.7, hp: 175, wt: 3.44, cyl: 8, vs: 0 },
          { mpg: 18.1, hp: 105, wt: 3.46, cyl: 6, vs: 1 },
          { mpg: 14.3, hp: 245, wt: 3.57, cyl: 8, vs: 0 },
          { mpg: 24.4, hp: 62, wt: 3.19, cyl: 4, vs: 1 },
          { mpg: 22.8, hp: 95, wt: 3.15, cyl: 4, vs: 1 },
          { mpg: 19.2, hp: 123, wt: 3.44, cyl: 6, vs: 1 },
        ]
      };
      
      setFileData(mockData);
      setColumns(mockData.columns);
      
      // Auto-set dependent variable
      setDependentVar('mpg');
      setIndependentVars(['hp', 'wt']);
      
      return;
    }
    
    // Real API call for non-demo files
    try {
      const response = await apiService.getFile(fileId);
      setFileData(response.data);
      setColumns(response.data.columns || []);
      
      // Auto-detect variable types with AI
      detectVariableTypes(response.data.columns, response.data.sample);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  const detectVariableTypes = async (cols, sample) => {
    try {
      const response = await apiService.detectTypes({
        columns: cols,
        sample: sample.slice(0, 5) // First 5 rows
      });
      
      // Auto-select dependent variable
      const dependent = response.data.variables.find(v => v.suggested_role === 'dependent');
      if (dependent) {
        setDependentVar(dependent.name);
      }
      
      // Auto-select independent variables
      const independent = response.data.variables
        .filter(v => v.suggested_role === 'independent')
        .map(v => v.name);
      setIndependentVars(independent);
      
    } catch (error) {
      console.error('Error detecting types:', error);
    }
  };

  const getModelSuggestion = async () => {
    if (!dependentVar || independentVars.length === 0) return;
    
    try {
      const response = await apiService.suggestModel({
        dependentVar: { name: dependentVar, type: 'continuous' }, // TODO: get actual type
        independentVars: independentVars.map(name => ({ name, type: 'continuous' }))
      });
      
      setAiSuggestion(response.data);
      setSelectedAnalysis(response.data.model);
    } catch (error) {
      console.error('Error getting suggestion:', error);
    }
  };

  const runAnalysis = async () => {
    if (!dependentVar || independentVars.length === 0) {
      alert('Please select variables');
      return;
    }

    setLoading(true);
    
    try {
      // Build formula
      const formula = `${dependentVar} ~ ${independentVars.join(' + ')}`;
      
      // Generate R code
      const code = generateRCode(selectedAnalysis, formula);
      setRCode(code);
      
      // Run regression
      const analysisFunc = selectedAnalysis === 'ols' ? apiService.runOLS : apiService.runLogistic;
      const response = await analysisFunc({
        formula: formula,
        data: fileData.data // Actual data
      });
      
      setOutput(response.data);
      setActiveTab('output');
      
      // Get AI interpretation
      interpretResults(response.data, formula);
      
    } catch (error) {
      console.error('Error running analysis:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const interpretResults = async (results, formula) => {
    try {
      const response = await apiService.interpretResults({
        model_type: selectedAnalysis,
        formula: formula,
        results: results
      });
      
      setAiExplanation(response.data.summary);
    } catch (error) {
      console.error('Error interpreting results:', error);
    }
  };

  const generateRCode = (analysis, formula) => {
    const templates = {
      ols: `# Ordinary Least Squares Regression
library(broom)

# Fit model
model <- lm(
  ${formula},
  data = your_data
)

# Get results
tidy_results <- tidy(model)
glance_results <- glance(model)

# Summary
summary(model)`,
      
      logistic: `# Logistic Regression
library(broom)

# Fit model
model <- glm(
  ${formula},
  data = your_data,
  family = binomial()
)

# Get results
tidy_results <- tidy(model)
glance_results <- glance(model)

# Summary
summary(model)`
    };
    
    return templates[analysis] || '';
  };

  const toggleVar = (varName) => {
    if (independentVars.includes(varName)) {
      setIndependentVars(independentVars.filter(v => v !== varName));
    } else {
      setIndependentVars([...independentVars, varName]);
    }
  };

  // Syntax highlight R code
  useEffect(() => {
    if (rCode) {
      Prism.highlightAll();
    }
  }, [rCode]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Left Drawer Menu */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-80 bg-slate-800/50 backdrop-blur-lg border-r border-slate-700/50 p-6 overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Analysis Setup
            </h2>

            {/* Analysis Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Analysis Type
              </label>
              <select
                value={selectedAnalysis}
                onChange={(e) => setSelectedAnalysis(e.target.value)}
                className="input w-full"
              >
                <option value="ols">Linear Regression (OLS)</option>
                <option value="logistic">Logistic Regression</option>
              </select>
            </div>

            {/* AI Suggestion */}
            {aiSuggestion && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-purple-300 mb-1">AI Suggestion</p>
                    <p className="text-xs text-gray-300">{aiSuggestion.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Dependent Variable */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Dependent Variable (Y)
              </label>
              <select
                value={dependentVar}
                onChange={(e) => setDependentVar(e.target.value)}
                className="input w-full"
              >
                <option value="">Select variable...</option>
                {columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Independent Variables */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Independent Variables (X)
              </label>
              <div className="space-y-2">
                {columns.filter(col => col !== dependentVar).map((col) => (
                  <label
                    key={col}
                    className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={independentVars.includes(col)}
                      onChange={() => toggleVar(col)}
                      className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-200">{col}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={getModelSuggestion}
                className="btn-secondary w-full flex items-center justify-center gap-2"
                disabled={!dependentVar || independentVars.length === 0}
              >
                <Sparkles className="w-4 h-4" />
                Get AI Suggestion
              </button>
              
              <button
                onClick={runAnalysis}
                disabled={loading || !dependentVar || independentVars.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Analysis
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Drawer Button */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-slate-700 p-2 rounded-r-lg hover:bg-slate-600 transition-colors z-10"
        style={{ left: drawerOpen ? '320px' : '0' }}
      >
        {drawerOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Right Panel - Code/Output/Explanation */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex gap-2 p-4 bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
          <TabButton
            active={activeTab === 'code'}
            onClick={() => setActiveTab('code')}
            icon={<Code2 className="w-4 h-4" />}
          >
            R Code
          </TabButton>
          <TabButton
            active={activeTab === 'output'}
            onClick={() => setActiveTab('output')}
            icon={<FileText className="w-4 h-4" />}
          >
            Output
          </TabButton>
          <TabButton
            active={activeTab === 'explain'}
            onClick={() => setActiveTab('explain')}
            icon={<Sparkles className="w-4 h-4" />}
          >
            AI Explanation
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {rCode ? (
                  <div className="code-block">
                    <pre>
                      <code className="language-r">{rCode}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>R code will appear here after running analysis</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'output' && (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {output ? (
                  <div className="space-y-6">
                    {/* Model Statistics */}
                    {output.glance && (
                      <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Model Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(output.glance).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-sm text-gray-400">{key}</p>
                              <p className="text-lg font-semibold">
                                {typeof value === 'number' ? value.toFixed(4) : value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coefficients Table */}
                    {output.tidy && (
                      <div className="card">
                        <h3 className="text-lg font-semibold mb-4">Coefficients</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b border-slate-600">
                              <tr>
                                <th className="text-left py-2">Term</th>
                                <th className="text-right py-2">Estimate</th>
                                <th className="text-right py-2">Std. Error</th>
                                <th className="text-right py-2">Statistic</th>
                                <th className="text-right py-2">P-Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {output.tidy.map((row, i) => (
                                <tr key={i} className="border-b border-slate-700/50">
                                  <td className="py-2">{row.term}</td>
                                  <td className="text-right">{row.estimate.toFixed(4)}</td>
                                  <td className="text-right">{row['std.error']?.toFixed(4)}</td>
                                  <td className="text-right">{row.statistic?.toFixed(4)}</td>
                                  <td className="text-right">
                                    <span className={row['p.value'] < 0.05 ? 'text-green-400 font-semibold' : ''}>
                                      {row['p.value']?.toFixed(4)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Results will appear here after running analysis</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'explain' && (
              <motion.div
                key="explain"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {aiExplanation ? (
                  <div className="card">
                    <div className="flex items-start gap-3 mb-4">
                      <Sparkles className="w-6 h-6 text-purple-400 flex-shrink-0" />
                      <h3 className="text-lg font-semibold">AI Interpretation</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{aiExplanation}</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>AI explanation will appear here after running analysis</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${active
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
          : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
        }
      `}
    >
      {icon}
      {children}
    </button>
  );
}