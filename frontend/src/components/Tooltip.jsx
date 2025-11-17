// components/Tooltip.jsx - Simple right-positioned tooltip
import { useState } from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';

const STAT_DEFINITIONS = {
  'r.squared': {
    term: 'R-Squared (R²)',
    definition: 'Measures how well model explains variation.',
    explanation: '0-1 scale. Higher = better. 0.80 = 80% explained.',
    example: 'R² = 0.827 means 82.7% explained.',
  },
  'adj.r.squared': {
    term: 'Adjusted R-Squared',
    definition: 'R² adjusted for number of variables.',
    explanation: 'Penalizes extra variables.',
    example: 'Slightly lower than R². Prevents overfitting.',
  },
  'p.value': {
    term: 'P-Value',
    definition: 'Probability result is random.',
    explanation: 'Lower = better. P < 0.05 = significant.',
    example: 'P = 0.001 = 0.1% chance random!',
  },
  'sigma': {
    term: 'Std Error',
    definition: 'Average prediction error.',
    explanation: 'Lower = better predictions.',
    example: 'Sigma = 2.5 = ±2.5 error.',
  },
  'statistic': {
    term: 'F-Statistic',
    definition: 'Tests if model beats average.',
    explanation: 'Higher = better.',
    example: 'F = 69, p < 0.05 = works!',
  },
  'df': {
    term: 'Degrees of Freedom',
    definition: 'Number of predictors.',
    explanation: 'Count of variables.',
    example: 'df = 2 means 2 predictors.',
  },
  'nobs': {
    term: 'Observations',
    definition: 'Data points used.',
    explanation: 'More = more reliable.',
    example: 'nobs = 32 = 32 rows.',
  },
  'estimate': {
    term: 'Coefficient',
    definition: 'Effect of variable.',
    explanation: 'Change per unit increase.',
    example: '-3.88: +1000lb = -3.88 MPG.',
  },
  'std.error': {
    term: 'Standard Error',
    definition: 'Uncertainty in estimate.',
    explanation: 'Smaller = more precise.',
    example: 'SE = 0.63 = ±1.26 range.',
  },
  't.statistic': {
    term: 'T-Statistic',
    definition: 'Distance from zero.',
    explanation: 'Beyond ±2 = significant.',
    example: 't = -6.13 = strong!',
  },
};

export default function Tooltip({ term, value, children }) {
  const [show, setShow] = useState(false);
  
  const normalized = term?.toLowerCase().replace(/\s+/g, '.');
  const def = STAT_DEFINITIONS[normalized];
  
  if (!def) return children || <span>{term}</span>;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {/* Trigger */}
      <div className="inline-flex items-center gap-1 cursor-help">
        {children || <span>{term}</span>}
        <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-blue-400" />
      </div>

      {/* Tooltip - Always appears to the RIGHT */}
      {show && (
        <div className="absolute left-full top-0 ml-3 w-64 z-[9999]">
          <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-3 text-left">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-bold text-blue-400 text-xs">
                {def.term}
              </h4>
              {value !== undefined && (
                <span className="text-xs font-mono bg-slate-700 px-1.5 py-0.5 rounded ml-2 shrink-0">
                  {typeof value === 'number' ? value.toFixed(4) : value}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-gray-300">
                {def.definition}
              </p>

              <p className="text-xs text-gray-400">
                {def.explanation}
              </p>

              <div className="bg-green-500/10 border border-green-500/30 rounded p-1.5">
                <p className="text-xs text-green-300">
                  💡 {def.example}
                </p>
              </div>
            </div>

            {/* Arrow pointing left */}
            <div className="absolute right-full top-3 mr-[-1px]">
              <div className="w-2 h-2 bg-slate-800 border-l border-t border-slate-600 rotate-[-45deg]"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}