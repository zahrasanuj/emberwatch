import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { fetchModelCard } from '../../services/api';
import { X, ShieldCheck, CheckCircle2, Info } from 'lucide-react';

export const ModelCardModal: React.FC = () => {
  const { isModelCardModalOpen, setModelCardModalOpen } = useStore();
  const [modelCard, setModelCard] = useState<any>(null);

  useEffect(() => {
    if (isModelCardModalOpen) {
      fetchModelCard().then(setModelCard).catch(console.error);
    }
  }, [isModelCardModalOpen]);

  if (!isModelCardModalOpen || !modelCard) return null;

  const m = modelCard.metrics || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="rounded-xl border max-w-xl w-full p-6 space-y-4 shadow-2xl"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--ok)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
              EmberWatch Predictive Model Card
            </h3>
          </div>
          <button
            onClick={() => setModelCardModalOpen(false)}
            className="p-1 rounded cursor-pointer transition hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close modal"
          >
            <X style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
          </button>
        </div><div className="space-y-1.5 text-xs">
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Architecture: </span>
            <strong style={{ color: 'var(--text-h)' }}>{modelCard.model_type}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Split Protocol: </span>
            <span style={{ color: 'var(--text)' }}>{modelCard.split_strategy}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Leakage Controls: </span>
            <span style={{ color: 'var(--text)' }}>{modelCard.leakage_prevention}</span>
          </div>
        </div><div
          className="p-4 rounded-lg border space-y-2.5 text-xs"
          style={{
            backgroundColor: 'var(--surface-2)',
            borderColor: 'var(--border)'
          }}
        >
          <div
            className="text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Out-of-Sample Validation vs Climatology Baseline
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div style={{ color: 'var(--text-muted)' }}>Mean Absolute Error (MAE):</div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-mono font-bold" style={{ color: 'var(--text-h)' }}>
                  {m.model_mae}
                </span>
                <span className="line-through text-xs" style={{ color: 'var(--text-muted)' }}>
                  {m.baseline_mae}
                </span>
                <span className="font-mono font-semibold text-xs" style={{ color: 'var(--ok)' }}>
                  +{m.mae_improvement_pct}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div style={{ color: 'var(--text-muted)' }}>Root Mean Square Error (RMSE):</div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-mono font-bold" style={{ color: 'var(--text-h)' }}>
                  {m.model_rmse}
                </span>
                <span className="line-through text-xs" style={{ color: 'var(--text-muted)' }}>
                  {m.baseline_rmse}
                </span>
                <span className="font-mono font-semibold text-xs" style={{ color: 'var(--ok)' }}>
                  +{m.rmse_improvement_pct}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div style={{ color: 'var(--text-muted)' }}>Brier Score (Probability Skill):</div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-mono font-bold" style={{ color: 'var(--text-h)' }}>
                  {m.model_brier_score}
                </span>
                <span className="line-through text-xs" style={{ color: 'var(--text-muted)' }}>
                  {m.baseline_brier_score}
                </span>
                <span className="font-mono font-semibold text-xs" style={{ color: 'var(--ok)' }}>
                  BSS: {m.brier_skill_score}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div style={{ color: 'var(--text-muted)' }}>Beats 20-Yr Baseline:</div>
              <div className="flex items-center gap-1.5 font-bold text-xs mt-1" style={{ color: 'var(--ok)' }}>
                <CheckCircle2 style={{ width: 15, height: 15, strokeWidth: 1.5 }} />
                <span>Verified Outperformance</span>
              </div>
            </div>
          </div>
        </div><div className="space-y-2 text-xs">
          <p
            className="p-3 rounded-lg border leading-relaxed"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text)'
            }}
          >
            <strong style={{ color: 'var(--text-h)' }}>Scientific Assessment: </strong>
            {modelCard.honest_evaluation}
          </p>
          <div className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <Info style={{ width: 14, height: 14, strokeWidth: 1.5, flexShrink: 0, marginTop: 2 }} />
            <p>
              <strong style={{ color: 'var(--text)' }}>Operational Caveat: </strong>
              {modelCard.operational_caveat}
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setModelCardModalOpen(false)}
            className="px-4 py-1.5 rounded text-xs font-semibold border cursor-pointer transition hover:bg-[var(--surface-2)]"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-h)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
