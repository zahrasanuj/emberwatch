import React from 'react';
import { useStore } from '../../store/useStore';
import { ReadinessData } from '../../types';
import { X, Printer, Shield } from 'lucide-react';

interface BriefingModalProps {
  readiness: ReadinessData | null;
}

export const BriefingModal: React.FC<BriefingModalProps> = ({ readiness }) => {
  const { isBriefingModalOpen, setBriefingModalOpen } = useStore();

  if (!isBriefingModalOpen || !readiness) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusTokens = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('unusual') || s.includes('critical') || s.includes('high') || s.includes('extreme') || s.includes('level 3')) {
      return { bg: 'var(--danger-bg)', border: 'var(--danger)', color: 'var(--danger)' };
    }
    if (s.includes('elevated') || s.includes('transition') || s.includes('moderate') || s.includes('level 2')) {
      return { bg: 'var(--warn-bg)', border: 'var(--warn)', color: 'var(--warn)' };
    }
    return { bg: 'var(--ok-bg)', border: 'var(--ok)', color: 'var(--ok)' };
  };

  const postureTokens = getStatusTokens(readiness.readiness_level);
  const currentTokens = getStatusTokens(readiness.current_status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white">
      <div
        className="rounded-xl border max-w-2xl w-full p-6 space-y-5 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:max-w-none"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)'
        }}
      ><div
          className="flex items-center justify-between pb-3 border-b print:hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Shield style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-h)' }}>
              EmberWatch Incident Preparedness Briefing
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer shadow-sm transition hover:opacity-95"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              <Printer style={{ width: 14, height: 14, strokeWidth: 1.5 }} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={() => setBriefingModalOpen(false)}
              className="p-1.5 rounded cursor-pointer transition hover:bg-[var(--surface-2)]"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close modal"
            >
              <X style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
            </button>
          </div>
        </div><div className="space-y-4 print:space-y-3"><div
            className="pb-4 border-b flex justify-between items-start"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <div
                className="text-lg font-bold tracking-tight print:text-black"
                style={{ color: 'var(--text-h)' }}
              >
                EMBERWATCH INCIDENT PREPAREDNESS BRIEFING
              </div>
              <div
                className="text-xs font-medium mt-0.5 print:text-neutral-700"
                style={{ color: 'var(--text-muted)' }}
              >
                Satellite Burning-Activity Intelligence Platform · NASA FIRMS & ERA5 Climatology
              </div>
              <div className="text-xs mt-2 print:text-neutral-700" style={{ color: 'var(--text)' }}>
                Target Region: <strong style={{ color: 'var(--text-h)' }} className="print:text-black">{readiness.region_name}</strong>
              </div>
            </div>

            <div className="text-right text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              <div>As Of: {readiness.as_of_date}</div>
              <div
                className="mt-1 px-2.5 py-0.5 rounded border font-bold uppercase inline-block text-[11px] print:bg-neutral-100 print:text-black print:border-neutral-300"
                style={{
                  backgroundColor: postureTokens.bg,
                  borderColor: postureTokens.border,
                  color: postureTokens.color
                }}
              >
                {readiness.readiness_badge}
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-3 gap-3 p-3.5 rounded-lg border text-xs print:bg-neutral-50 print:border-neutral-300"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)'
            }}
          >
            <div>
              <div style={{ color: 'var(--text-muted)' }} className="print:text-neutral-600">Current Status:</div>
              <div className="text-base font-bold mt-0.5 print:text-black" style={{ color: currentTokens.color }}>
                {readiness.current_status}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }} className="print:text-neutral-600">Anomaly Departure:</div>
              <div className="text-base font-mono font-bold mt-0.5 print:text-black" style={{ color: 'var(--text-h)' }}>
                {readiness.anomaly_z_score > 0 ? `+${readiness.anomaly_z_score}` : readiness.anomaly_z_score}σ
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }} className="print:text-neutral-600">30-Day Risk Horizon:</div>
              <div className="text-base font-bold mt-0.5 print:text-black" style={{ color: 'var(--text-h)' }}>
                {readiness.forecast_30d_label}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div
              className="text-[11px] font-bold uppercase tracking-[0.08em] print:text-black"
              style={{ color: 'var(--text-muted)' }}
            >
              Phased Operational Action Protocols:
            </div>
            <div className="space-y-2">
              {readiness.checklist.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border text-xs space-y-1 print:border-neutral-300 print:bg-white"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)'
                  }}
                >
                  <div className="flex justify-between items-center font-semibold">
                    <span style={{ color: 'var(--text-h)' }} className="print:text-black">
                      {i + 1}. {item.category}
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded border uppercase print:bg-neutral-100 print:text-black"
                      style={{
                        backgroundColor: 'var(--surface-2)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Priority: {item.priority}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text)' }} className="print:text-neutral-800 text-xs">
                    {item.action}
                  </p>
                  <div
                    className="text-[11px] font-mono print:text-neutral-600"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Protocol: {item.protocol}
                  </div>
                </div>
              ))}
            </div>
          </div><div
            className="pt-3 border-t text-[11px] italic text-center print:border-neutral-300 print:text-neutral-600"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-muted)'
            }}
          >
            {readiness.footer_disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};
