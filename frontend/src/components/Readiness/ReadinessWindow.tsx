import React, { useState } from 'react';
import { ReadinessData } from '../../types';
import { useStore } from '../../store/useStore';
import { Shield, CheckSquare, Square, Printer, ChevronDown, ChevronRight, Info } from 'lucide-react';

interface ReadinessWindowProps {
  readiness: ReadinessData | null;
}

export const ReadinessWindow: React.FC<ReadinessWindowProps> = ({ readiness }) => {
  const { setBriefingModalOpen } = useStore();
  const [checklist, setChecklist] = useState<any[]>(readiness?.checklist || []);
  const [expandedProtocols, setExpandedProtocols] = useState<Record<number, boolean>>({});

  React.useEffect(() => {
    if (readiness?.checklist) setChecklist(readiness.checklist);
  }, [readiness]);

  if (!readiness) return null;

  const toggleCheck = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setChecklist(prev =>
      prev.map((item, i) => (i === idx ? { ...item, completed: !item.completed } : item))
    );
  };

  const toggleDisclosure = (idx: number) => {
    setExpandedProtocols(prev => ({ ...prev, [idx]: !prev[idx] }));
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
  const statusTokens = getStatusTokens(readiness.current_status);

  const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getVigilanceDotColor = (vigilance: string) => {
    const v = vigilance.toLowerCase();
    if (v.includes('heightened') || v.includes('high') || v.includes('critical')) return 'var(--danger)';
    if (v.includes('transition') || v.includes('elevated') || v.includes('moderate')) return 'var(--warn)';
    return 'var(--ok)';
  };

  return (
    <div className="space-y-5" style={{ color: 'var(--text)' }}><div
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-h)' }}>
            <Shield style={{ width: 18, height: 18, strokeWidth: 1.5, color: 'var(--text-muted)' }} />
            <span>Response Readiness Window & Action Protocols</span>
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Phased inter-agency preparedness scaled to climatological risk and forecast severity.
          </p>
        </div>

        <button
          onClick={() => setBriefingModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold cursor-pointer shadow-sm transition hover:opacity-95 active:scale-[0.98]"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-contrast)'
          }}
        >
          <Printer style={{ width: 14, height: 14, strokeWidth: 1.5 }} />
          <span>Export Briefing Sheet</span>
        </button>
      </div>

      <div
        className="p-4 rounded-lg border space-y-2.5"
        style={{
          backgroundColor: 'var(--surface-2)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>
            Recommended Deployment Posture
          </span>
          <span
            className="px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wider"
            style={{
              backgroundColor: postureTokens.bg,
              borderColor: postureTokens.border,
              color: postureTokens.color
            }}
          >
            {readiness.readiness_badge}
          </span>
        </div>

        <div className="text-lg font-bold" style={{ color: 'var(--text-h)' }}>
          {readiness.readiness_level}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-semibold border"
              style={{
                backgroundColor: statusTokens.bg,
                borderColor: statusTokens.border,
                color: statusTokens.color
              }}
            >
              {readiness.current_status}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--text-muted)' }}>30-Day Risk:</span>
            <strong style={{ color: 'var(--text-h)' }}>{readiness.forecast_30d_label}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--text-muted)' }}>Anomaly Departure:</span>
            <span className="font-mono font-bold" style={{ color: 'var(--text-h)' }}>
              {readiness.anomaly_z_score > 0 ? `+${readiness.anomaly_z_score}` : readiness.anomaly_z_score}σ
            </span>
          </div>
        </div>

        <div
          className="pt-2.5 border-t text-xs flex items-start gap-1.5"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <Info style={{ width: 14, height: 14, strokeWidth: 1.5, flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }} />
          <span>
            Posture driven by 30-day forecast: {readiness.forecast_30d_label} risk horizon with current seasonal departure of {readiness.anomaly_z_score > 0 ? `+${readiness.anomaly_z_score}` : readiness.anomaly_z_score}σ.
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold" style={{ color: 'var(--text-h)' }}>
            Annual Operational Vigilance Calendar
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Hover month for complete classification
          </span>
        </div><div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {readiness.monthly_readiness_calendar.map((m, idx) => {
            const abbr = monthAbbrs[idx] || m.month_name.slice(0, 3);
            const dotColor = getVigilanceDotColor(m.vigilance_level);
            const isCurrent = m.is_current_month;

            return (
              <div
                key={m.month_num}
                title={`${m.month_name}: ${m.vigilance_level}${isCurrent ? ' (Current Month)' : ''}`}
                className="p-2 rounded border text-center transition flex flex-col items-center justify-center gap-1"
                style={{
                  backgroundColor: isCurrent ? 'var(--surface-2)' : 'var(--surface)',
                  borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                  borderWidth: isCurrent ? 2 : 1
                }}
              >
                <span
                  className="text-xs font-semibold"
                  style={{ color: isCurrent ? 'var(--text-h)' : 'var(--text)' }}
                >
                  {abbr}
                </span>
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: dotColor }}
                />
              </div>
            );
          })}
        </div><div
          className="flex flex-wrap items-center gap-4 text-[11px] pt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--danger)' }} />
            <span>Heightened Vigilance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--warn)' }} />
            <span>Pre-Season Transition</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ok)' }} />
            <span>Baseline / Low Vigilance</span>
          </div>
        </div>
      </div><div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold" style={{ color: 'var(--text-h)' }}>
            Action Protocol Checklist
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {checklist.filter(c => c.completed).length} of {checklist.length} completed
          </span>
        </div>

        <div className="space-y-1.5">
          {checklist.map((item, idx) => {
            const isExpanded = !!expandedProtocols[idx];
            const isCritical = item.priority?.toLowerCase() === 'critical' || item.priority?.toLowerCase() === 'high';

            return (
              <div
                key={idx}
                className="rounded-lg border overflow-hidden transition"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
              >

                <div
                  onClick={() => toggleDisclosure(idx)}
                  className="p-3 flex items-start gap-2.5 cursor-pointer hover:bg-[var(--surface-2)] transition"
                >
                  <button
                    onClick={(e) => toggleCheck(idx, e)}
                    className="mt-0.5 cursor-pointer transition hover:opacity-80"
                    style={{ color: item.completed ? 'var(--ok)' : 'var(--text-muted)' }}
                    aria-label={item.completed ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {item.completed ? (
                      <CheckSquare style={{ width: 16, height: 16, strokeWidth: 1.5, color: 'var(--ok)' }} />
                    ) : (
                      <Square style={{ width: 16, height: 16, strokeWidth: 1.5 }} />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-semibold truncate"
                        style={{
                          color: item.completed ? 'var(--text-muted)' : 'var(--text-h)',
                          textDecoration: item.completed ? 'line-through' : 'none'
                        }}
                      >
                        {item.category}
                      </span>
                      <span
                        className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold flex-shrink-0"
                        style={{
                          backgroundColor: isCritical ? 'var(--danger-bg)' : 'var(--surface-2)',
                          borderColor: isCritical ? 'var(--danger)' : 'var(--border)',
                          color: isCritical ? 'var(--danger)' : 'var(--text-muted)'
                        }}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <p
                      className="text-xs mt-0.5"
                      style={{
                        color: item.completed ? 'var(--text-muted)' : 'var(--text)',
                        textDecoration: item.completed ? 'line-through' : 'none'
                      }}
                    >
                      {item.action}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDisclosure(idx);
                    }}
                    className="p-1 rounded cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Toggle protocol details"
                  >
                    {isExpanded ? (
                      <ChevronDown style={{ width: 14, height: 14, strokeWidth: 1.5 }} />
                    ) : (
                      <ChevronRight style={{ width: 14, height: 14, strokeWidth: 1.5 }} />
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div
                    className="px-3 py-2.5 border-t text-xs space-y-1"
                    style={{
                      backgroundColor: 'var(--surface-2)',
                      borderColor: 'var(--border)',
                      color: 'var(--text)'
                    }}
                  >
                    <div className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Standard Operating Protocol:
                    </div>
                    <div style={{ color: 'var(--text-h)' }}>
                      {item.protocol}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="text-[11px] pt-3 border-t leading-normal"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-muted)'
        }}
      >
        {readiness.footer_disclaimer}
      </div>
    </div>
  );
};
