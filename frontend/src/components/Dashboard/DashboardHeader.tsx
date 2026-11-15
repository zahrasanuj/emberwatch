import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { MapPin, FileDown, Copy, Check, Clock, ShieldCheck } from 'lucide-react';

interface DashboardHeaderProps {
  regionName: string;
  statusBadge: string;
  confidenceLevel: string;
  asOfTime: string;
  dataWindow: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  regionName,
  statusBadge,
  confidenceLevel,
  asOfTime,
  dataWindow
}) => {
  const { activeRegionId, setCurrentPage, setBriefingModalOpen } = useStore();
  const [copied, setCopied] = useState(false);

  const badgeColorClass =
    statusBadge === 'Unusual'
      ? 'bg-[var(--danger-bg)] text-[var(--danger)] border-[rgba(184,52,31,0.3)]'
      : statusBadge === 'Elevated'
      ? 'bg-[var(--warn-bg)] text-[var(--warn)] border-[rgba(183,121,31,0.3)]'
      : 'bg-[var(--ok-bg)] text-[var(--ok)] border-[rgba(47,125,87,0.3)]';

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenOnMap = () => {
    setCurrentPage('map');
  };

  return (
    <div className="pb-4 pt-2 border-b border-[var(--border)] mb-4">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="micro-label uppercase tracking-widest text-[9px] font-mono font-bold text-[var(--text-muted)]">
              {activeRegionId ? 'REGIONAL ANALYTICS WORKSPACE' : 'GLOBAL TELEMETRY WORKSPACE'}
            </span>
            <span className={`status-label text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badgeColorClass}`}>
              {statusBadge}
            </span>
          </div>

          <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-h)] leading-tight">
            {regionName}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)] font-mono pt-0.5">
            <span className="inline-flex items-center gap-1 text-[var(--text)]">
              <Clock className="w-3.5 h-3.5" />
              {asOfTime || 'Live Feed'}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--ok)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              {confidenceLevel || 'Harmonised (R²≥0.85)'}
            </span>
            <span>•</span>
            <span className="text-[var(--text-muted)]">{dataWindow}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-1">

          <button
            type="button"
            onClick={handleOpenOnMap}
            title="Open interactive spatial Map workspace for this area"
            className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-semibold text-[var(--text-h)] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Open on Map</span>
          </button><button
            type="button"
            onClick={handleCopyLink}
            title="Copy URL permalink to clipboard"
            className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-semibold text-[var(--text-h)] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--ok)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
          </button><button
            type="button"
            onClick={() => setBriefingModalOpen(true)}
            title="Generate executive readiness briefing"
            className="h-9 px-3.5 rounded-lg border border-transparent bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Briefing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
