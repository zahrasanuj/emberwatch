import React, { useState } from 'react';
import { DashboardCard } from './DashboardCard';
import { Shield, CheckSquare, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface ReadinessSectionProps {
  readinessData: any;
  regionName: string;
}

export const ReadinessSection: React.FC<ReadinessSectionProps> = ({
  readinessData,
  regionName
}) => {
  const [expandedProtocol, setExpandedProtocol] = useState<number | null>(null);

  const level = readinessData?.level || 'Level 2: Heightened Vigilance';
  const badge = readinessData?.badge || 'Elevated';
  const reasonLine = readinessData?.reason_line ||
    'Posture driven by 30-day forecast (+28.4% above median), prolonged rainfall deficit (-38.2mm), and antecedent dry fuels.';

  const months = [
    { name: 'Jan', status: 'low' },
    { name: 'Feb', status: 'low' },
    { name: 'Mar', status: 'low' },
    { name: 'Apr', status: 'low' },
    { name: 'May', status: 'guarded' },
    { name: 'Jun', status: 'heightened' },
    { name: 'Jul', status: 'critical' },
    { name: 'Aug', status: 'critical' },
    { name: 'Sep', status: 'critical' },
    { name: 'Oct', status: 'heightened' },
    { name: 'Nov', status: 'guarded' },
    { name: 'Dec', status: 'low' }
  ];

  const protocols = [
    {
      title: 'Aerial & Ground Suppression Pre-Positioning',
      summary: 'Stage air tankers and initial attack type 3 engines within 30-minute flight radii.',
      detail: 'Coordinate with state forestry headquarters for mutual aid standby. Ensure helitack bases at elevated water reservoirs are primed.'
    },
    {
      title: 'Critical Infrastructure & Utility De-Energization',
      summary: 'Alert distribution grid operators for high-wind Public Safety Power Shutoff (PSPS).',
      detail: 'Inspect right-of-way vegetation clearance along primary 230kV transmission corridors. Verify backup generator readiness at water pumping facilities.'
    },
    {
      title: 'Community Ingress/Egress Route Verification',
      summary: 'Clear secondary evacuation corridors of heavy fallen timber and dry brush.',
      detail: 'Audit digital early warning sirens and reverse 911 wireless emergency alert dispatch channels.'
    }
  ];

  const getDotColor = (status: string) => {
    switch (status) {
      case 'critical': return 'var(--danger)';
      case 'heightened': return 'var(--accent)';
      case 'guarded': return 'var(--warn)';
      default: return 'var(--ok)';
    }
  };

  return (
    <DashboardCard
      id="sec-readiness"
      microLabel="OPERATIONAL PLANNING & PREPAREDNESS"
      heading="Readiness Window & Tactical Posture"
      subtitle="Seasonality-adjusted operational vigilance matrix and response protocols"
      colSpan="col-span-12"
      csvFilename={`readiness_posture_${regionName.toLowerCase().replace(/\s+/g, '_')}`}
    >
      <div className="space-y-4"><div className="p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent)]" />
              <strong className="text-sm font-bold text-[var(--text-h)]">
                {level}
              </strong>
            </div>

            <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded border border-[rgba(217,72,28,0.3)] bg-[var(--accent-bg)] text-[var(--accent)]">
              {badge}
            </span>
          </div>

          <p className="text-xs text-[var(--text)] leading-relaxed font-mono">
            {reasonLine}
          </p>
        </div><div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold block">
            ANNUAL VIGILANCE CALENDAR
          </span>

          <div className="grid grid-cols-12 gap-1 bg-[var(--surface-2)] p-2 rounded border border-[var(--border)]">
            {months.map((m) => (
              <div key={m.name} className="flex flex-col items-center justify-between py-1.5 rounded text-center">
                <span className="text-[10px] font-mono text-[var(--text-muted)] mb-1">
                  {m.name}
                </span>

                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: getDotColor(m.status) }}
                  title={`${m.name}: ${m.status.toUpperCase()} vigilance`}
                />
              </div>
            ))}
          </div>
        </div><div className="space-y-2 pt-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold block">
            PREPAREDNESS ACTION PROTOCOLS
          </span>

          <div className="space-y-2">
            {protocols.map((proto, idx) => {
              const isExpanded = expandedProtocol === idx;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] space-y-1.5 transition"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedProtocol(isExpanded ? null : idx)}
                    className="w-full text-left flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <CheckSquare className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-xs font-bold text-[var(--text-h)] block">
                          {proto.title}
                        </strong>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                          {proto.summary}
                        </p>
                      </div>
                    </div>

                    <div className="p-0.5 text-[var(--text-muted)] shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="pt-2 border-t border-[var(--border)] text-xs text-[var(--text)] font-sans pl-6 leading-relaxed bg-[var(--surface)] p-2 rounded">
                      {proto.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div><div className="pt-3 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)] italic font-mono flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 text-[var(--warn)]" />
          <span>Based on historical patterns and model estimates. Not a live emergency alert.</span>
        </div>
      </div>
    </DashboardCard>
  );
};
