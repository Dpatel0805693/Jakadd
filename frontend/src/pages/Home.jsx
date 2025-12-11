import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, TrendingUp, BarChart3, Zap, Brain, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950">
      
      {/* Hero Section - Minimal & Centered */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-semibold text-slate-100 mb-4 tracking-tight">
            Stats<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Mate</span>
          </h1>
          <p className="text-lg text-slate-400 font-light">
            Statistical analysis, powered by AI
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row justify-center gap-3 mb-20"
        >
          <button 
            onClick={() => navigate('/upload')}
            className="group px-6 py-3 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-500 transition-all flex items-center justify-center"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Data
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button 
            onClick={() => navigate('/results/demo')}
            className="px-6 py-3 bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-all flex items-center justify-center"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Demo
          </button>
        </motion.div>

        {/* Feature Cards - Minimal Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20"
        >
          <FeatureCard
            icon={<Brain className="h-5 w-5" />}
            title="AI-Powered"
            description="Plain-language explanations of complex statistical results"
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Smart Analysis"
            description="Automatic variable detection and model recommendations"
          />
          <FeatureCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Professional Output"
            description="Publication-ready visualizations and comprehensive reports"
          />
        </motion.div>

        {/* How It Works - Minimal */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-xl p-10"
        >
          <h2 className="text-xl font-medium text-slate-200 mb-8">How It Works</h2>
          
          <div className="space-y-6">
            <WorkflowStep
              number="1"
              title="Upload Your Data"
              description="Drop a CSV or Excel file with your dataset"
            />
            <WorkflowStep
              number="2"
              title="Configure Analysis"
              description="AI detects variables and suggests optimal models"
            />
            <WorkflowStep
              number="3"
              title="Get Results"
              description="View results with visualizations and AI explanations"
            />
          </div>
        </motion.div>

        {/* Educational Feature Callout - Subtle */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-xl p-6 text-left"
        >
          <div className="flex items-start">
            <Sparkles className="h-5 w-5 text-violet-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-violet-400 mb-2">
                Educational Tooltips
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                Hover over any statistical term to see its definition, explanation, and real-world examples. 
                No more confusion about p-values, R², or t-statistics.
              </p>
              <p className="text-xs text-slate-500 italic">
                Making statistics accessible for everyone.
              </p>
            </div>
          </div>
        </motion.div>

      </div>

    </div>
  );
}

// Minimal Feature Card
function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 hover:bg-slate-900/50 hover:border-slate-700/50 transition-all group">
      <div className="w-10 h-10 bg-slate-800/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-800 transition-colors">
        <div className="text-violet-400">
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-slate-200 mb-2">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

// Minimal Workflow Step
function WorkflowStep({ number, title, description }) {
  return (
    <div className="flex items-start text-left">
      <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white font-medium text-sm mr-4 flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-slate-200 mb-1">{title}</h3>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}