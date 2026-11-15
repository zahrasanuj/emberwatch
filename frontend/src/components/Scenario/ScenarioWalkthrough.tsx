import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { fetchScenario } from '../../services/api';
import { ScenarioStory } from '../../types';
import { X, ChevronLeft, ChevronRight, Compass, CheckCircle2 } from 'lucide-react';

export const ScenarioWalkthrough: React.FC = () => {
  const { isScenarioModalOpen, setScenarioModalOpen, activeRegionId } = useStore();
  const [story, setStory] = useState<ScenarioStory | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);

  useEffect(() => {
    if (isScenarioModalOpen) {
      fetchScenario(activeRegionId || 'california')
        .then((s) => {
          setStory(s);
          setCurrentStepIdx(0);
        })
        .catch(console.error);
    }
  }, [isScenarioModalOpen, activeRegionId]);

  if (!isScenarioModalOpen || !story) return null;

  const steps = story.steps || [];
  const currentStep = steps[currentStepIdx];
  const progressPct = ((currentStepIdx + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="rounded-xl border max-w-xl w-full p-6 space-y-4 shadow-2xl"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      ><div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--surface-2)' }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              backgroundColor: 'var(--accent)'
            }}
            className="h-full transition-all duration-300"
          />
        </div>

        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Compass style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>{story.scenario_title}</h3>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Date: {story.date} ({story.notable_event})
              </div>
            </div>
          </div>
          <button
            onClick={() => setScenarioModalOpen(false)}
            className="p-1 rounded cursor-pointer transition hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close modal"
          >
            <X style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
          </button>
        </div>

        {currentStep && (
          <div className="space-y-4 py-2 min-h-[200px]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Step {currentStep.step_number} of {steps.length}: {currentStep.title}
                </span>
                <h4 className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-h)' }}>
                  {currentStep.subtitle}
                </h4>
              </div>

              <span
                className="text-xs px-2.5 py-0.5 rounded border font-semibold"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-h)'
                }}
              >
                {currentStep.badge}
              </span>
            </div><p
              className="text-xs leading-relaxed p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }}
            >
              {currentStep.body}
            </p>

            <div
              className="p-3 rounded-lg border flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{currentStep.metric_label}:</span>
              <strong className="font-mono text-sm" style={{ color: 'var(--text-h)' }}>
                {currentStep.metric_value}
              </strong>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            disabled={currentStepIdx === 0}
            onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold border cursor-pointer transition hover:bg-[var(--surface-2)] disabled:opacity-40"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)'
            }}
          >
            <ChevronLeft style={{ width: 14, height: 14, strokeWidth: 1.5 }} />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {currentStepIdx + 1} / {steps.length}
          </span>

          {currentStepIdx < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStepIdx((prev) => Math.min(steps.length - 1, prev + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition hover:opacity-95"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              <span>Next</span>
              <ChevronRight style={{ width: 14, height: 14, strokeWidth: 1.5 }} />
            </button>
          ) : (
            <button
              onClick={() => setScenarioModalOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border cursor-pointer transition hover:bg-[var(--surface-2)]"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-h)'
              }}
            >
              <CheckCircle2 style={{ width: 14, height: 14, strokeWidth: 1.5, color: 'var(--ok)' }} />
              <span>Complete Tour</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
