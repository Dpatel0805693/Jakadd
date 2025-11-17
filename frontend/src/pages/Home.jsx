// pages/Home.jsx - Temporary home page for testing
import { Link } from 'react-router-dom';
import { Upload, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          StatsMate
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          AI-Powered Statistical Analysis
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link to="/configure/demo" className="btn-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Try Demo Analysis
          </Link>
        </div>

        <div className="mt-12 p-6 bg-slate-800/30 rounded-lg max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Quick Start Guide</h2>
          <div className="text-left space-y-2 text-gray-300">
            <p>1. Upload your CSV or Excel file</p>
            <p>2. Let AI detect variable types</p>
            <p>3. Select analysis type (OLS or Logistic)</p>
            <p>4. Review R code and results</p>
            <p>5. Get plain-language AI explanations</p>
          </div>
        </div>
      </div>
    </div>
  );
}