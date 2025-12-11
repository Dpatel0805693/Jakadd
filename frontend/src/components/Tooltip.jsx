import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

// Educational definitions for statistical terms
const STAT_DEFINITIONS = {
  'r.squared': {
    term: 'R-Squared (R²)',
    definition: 'Measures how well the model explains the variation in your data.',
    explanation: 'Values range from 0 to 1. Higher is better.',
    example: 'R² = 0.827 means your model explains 82.7% of the variation.',
  },
  'adj.r.squared': {
    term: 'Adjusted R-Squared',
    definition: 'R² adjusted for the number of variables in your model.',
    explanation: 'Penalizes adding unnecessary variables. Use when comparing models.',
    example: 'Always slightly lower than R². Prevents overfitting.',
  },
  'f.statistic': {
    term: 'F-Statistic',
    definition: 'Tests if your model is better than just using the average.',
    explanation: 'Higher values mean your model adds significant explanatory power.',
    example: 'F = 69.21 with p < 0.001 means the model is highly significant.',
  },
  'p.value': {
    term: 'P-Value',
    definition: 'Probability that results occurred by chance.',
    explanation: 'Lower is better. P < 0.05 means less than 5% chance of randomness.',
    example: 'P = 0.001 means only 0.1% chance results are random. Very significant!',
  },
  'estimate': {
    term: 'Coefficient Estimate',
    definition: 'Shows the size and direction of a variable\'s effect.',
    explanation: 'Positive = variables move together. Negative = opposite directions.',
    example: 'Estimate = -3.88 for weight means each 1000 lb increase reduces MPG by 3.88.',
  },
  'std.error': {
    term: 'Standard Error',
    definition: 'Measures uncertainty in the coefficient estimate.',
    explanation: 'Smaller is better. Shows how precise the estimate is.',
    example: 'SE = 0.633 means the true effect is likely within ±0.633 of the estimate.',
  },
  't.statistic': {
    term: 't-Statistic',
    definition: 'Tests if a coefficient is significantly different from zero.',
    explanation: 'Larger absolute values indicate stronger evidence of an effect.',
    example: 't = -6.13 means the effect is highly significant (far from zero).',
  },
  'significance': {
    term: 'Significance Stars',
    definition: 'Visual indicator of statistical significance.',
    explanation: '*** = p<0.001, ** = p<0.01, * = p<0.05, . = p<0.1',
    example: '*** means highly significant. Very unlikely due to chance.',
  },
  'residual': {
    term: 'Residual',
    definition: 'Difference between actual value and model prediction.',
    explanation: 'Should be randomly scattered around zero for a good model.',
    example: 'Residual = 0.15 means prediction was 0.15 units too low.',
  },
};

export default function Tooltip({ term, value, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const def = STAT_DEFINITIONS[term];

  if (!def) return children;

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.right + 8, // 8px to the right of element
      y: rect.top,
    });
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div
        className="inline-flex items-center gap-1 cursor-help group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        <HelpCircle className="w-3 h-3 text-slate-500 group-hover:text-violet-400 transition-colors" />
      </div>

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              zIndex: 9999,
            }}
            className="w-80"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="bg-slate-800 border border-slate-700/50 rounded-lg p-4 shadow-2xl">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-200">{def.term}</h4>
                {value !== undefined && (
                  <span className="text-xs font-mono text-violet-400 ml-2">
                    {typeof value === 'number' ? value.toFixed(4) : value}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {def.definition}
                </p>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {def.explanation}
                </p>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                  <p className="text-xs text-emerald-300 leading-relaxed">
                    💡 {def.example}
                  </p>
                </div>
              </div>

              {/* Arrow pointing left */}
              <div 
                style={{
                  position: 'absolute',
                  right: '100%',
                  top: '12px',
                  marginRight: '-1px',
                }}
              >
                <div className="w-2 h-2 bg-slate-800 border-l border-t border-slate-700/50 rotate-[-45deg]"></div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}