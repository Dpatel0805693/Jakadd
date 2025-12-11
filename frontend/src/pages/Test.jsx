import React, { useState } from 'react';

export default function Test() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testService = async (name, url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const runTests = async () => {
    setLoading(true);
    const testResults = {};

    // Test all services
    console.log('Testing all services...');
    
    testResults.coreAPI = await testService('Core API', 'http://localhost:3000/health');
    testResults.integrationAPI = await testService('Integration API', 'http://localhost:5001/health');
    testResults.aiGateway = await testService('AI Gateway', 'http://localhost:8001/health');
    testResults.rOLS = await testService('R-OLS', 'http://localhost:8000/ping');
    testResults.rLogistic = await testService('R-Logistic', 'http://localhost:8002/ping');

    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Backend Connection Test</h1>
        <p className="text-slate-400 mb-8">Testing all microservices</p>
        
        <button
          onClick={runTests}
          disabled={loading}
          className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:bg-slate-700 mb-8 font-medium"
        >
          {loading ? 'Testing...' : 'Run All Tests'}
        </button>

        <div className="grid grid-cols-1 gap-4">
          <ServiceTest name="Core API" port="3000" result={results.coreAPI} />
          <ServiceTest name="Integration API" port="5001" result={results.integrationAPI} />
          <ServiceTest name="AI Gateway" port="8001" result={results.aiGateway} />
          <ServiceTest name="R-OLS Service" port="8000" result={results.rOLS} />
          <ServiceTest name="R-Logistic Service" port="8002" result={results.rLogistic} />
        </div>
      </div>
    </div>
  );
}

function ServiceTest({ name, port, result }) {
  if (!result) return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
      <h2 className="text-lg font-medium text-slate-200">
        {name} <span className="text-slate-500 text-sm">(Port {port})</span>
      </h2>
      <p className="text-slate-500 text-sm mt-2">Not tested yet</p>
    </div>
  );

  return (
    <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium text-slate-200">
          {name} <span className="text-slate-500 text-sm">(Port {port})</span>
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          result.success 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/20 text-rose-400'
        }`}>
          {result.success ? '✅ Connected' : '❌ Failed'}
        </span>
      </div>
      <pre className="mt-2 text-xs text-slate-400 overflow-auto bg-slate-950/50 p-3 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}