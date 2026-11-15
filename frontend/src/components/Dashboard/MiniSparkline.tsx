import React from 'react';

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number | string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  color = 'var(--accent)',
  height = 24,
  width = '100%'
}) => {
  if (!data || data.length < 2) {
    return <div style={{ height, width }} className="w-full" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = height - 4;
  const w = 100;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * w;
      const y = h - ((val - min) / range) * h + 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="overflow-visible"
      style={{ height, width }}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
