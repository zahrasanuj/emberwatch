import React from 'react';
import { ShapFactor } from '../../types';
import { Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ExplainableAiProps {
  factors: ShapFactor[];
}

export const ExplainableAi: React.FC<ExplainableAiProps> = ({ factors }) => {
  if (!factors || factors.length === 0) return null;

  return (
    <div className="space-y-5" style={{ color: 'var(--text)' }}><div className="pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
          <Sparkles style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
          <span>Explainable AI: Key Atmospheric & Climatological Drivers</span>
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Shapley Additive Explanations (SHAP) decomposing individual feature push relative to baseline.
        </p>
      </div>

      <div className="space-y-2.5">
        {factors.slice(0, 6).map((f, i) => {
          const isIncrease = f.direction === 'increases';
          const maxImp = Math.max(...factors.map(x => x.absolute_importance), 1.0);
          const widthPct = Math.min(100, Math.max(12, (f.absolute_importance / maxImp) * 100));

          return (
            <div
              key={i}
              className="p-3.5 rounded-lg border text-xs space-y-2"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-h)' }}>
                  {isIncrease ? (
                    <ArrowUpRight style={{ width: 15, height: 15, strokeWidth: 1.5, color: 'var(--heat-3)' }} />
                  ) : (
                    <ArrowDownRight style={{ width: 15, height: 15, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
                  )}
                  <span>{f.feature}</span>
                </span>
                <span
                  className="font-mono font-bold text-xs"
                  style={{ color: isIncrease ? 'var(--heat-3)' : 'var(--text)' }}
                >
                  {f.shap_value > 0 ? `+${f.shap_value}` : f.shap_value} SHAP
                </span>
              </div><div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                <div
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: isIncrease ? 'var(--heat-3)' : 'var(--border-strong)'
                  }}
                  className="h-full rounded-full transition-all"
                />
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {f.plain_language}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
