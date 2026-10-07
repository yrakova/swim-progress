import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ResultSeries, SwimResult } from '../types';
import { formatDate, formatTime, shortRank } from '../utils/analytics';

interface ProgressChartProps {
  series: ResultSeries;
}

interface ChartDotProps {
  cx?: number;
  cy?: number;
  payload?: SwimResult;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: SwimResult }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  const result = payload?.[0]?.payload;
  if (!active || !result) return null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__date">{formatDate(result.startDate)}</div>
      <div className="chart-tooltip__time">{formatTime(result.timeSeconds)}</div>
      <div className="chart-tooltip__rank">{shortRank(result.rank)}</div>
      <div className="chart-tooltip__competition">{result.competition}</div>
    </div>
  );
}

export function ProgressChart({ series }: ProgressChartProps) {
  const bestId = series.best.id;
  const latestId = series.latest.id;
  const values = series.results.map((item) => item.timeSeconds);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(4, (max - min) * 0.12);

  const renderDot = ({ cx = 0, cy = 0, payload }: ChartDotProps) => {
    if (!payload) return null;
    const isBest = payload.id === bestId;
    const isLatest = payload.id === latestId;
    const fill = isBest ? '#fa541c' : isLatest ? '#13c2c2' : '#1677ff';
    const radius = isBest ? 7 : isLatest ? 6 : 3.5;

    return (
      <g>
        {isBest && <circle cx={cx} cy={cy} r={12} fill="#fff2e8" />}
        <circle cx={cx} cy={cy} r={radius} fill={fill} stroke="#fff" strokeWidth={2} />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={series.results} margin={{ top: 16, right: 18, left: 0, bottom: 4 }}>
        <XAxis
          dataKey="startDate"
          tickFormatter={(value: string) => formatDate(value, false)}
          axisLine={{ stroke: '#d9d9d9' }}
          tickLine={false}
          minTickGap={32}
          tick={{ fill: '#8c8c8c', fontSize: 12 }}
        />
        <YAxis
          dataKey="timeSeconds"
          domain={[Math.max(0, min - padding), max + padding]}
          reversed
          tickFormatter={(value: number) => formatTime(value)}
          axisLine={false}
          tickLine={false}
          width={56}
          tick={{ fill: '#8c8c8c', fontSize: 12 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#d9d9d9', strokeDasharray: '4 4' }} />
        <Line
          type="monotone"
          dataKey="timeSeconds"
          stroke="#1677ff"
          strokeWidth={3}
          dot={renderDot}
          activeDot={{ r: 7, fill: '#1677ff', stroke: '#fff', strokeWidth: 3 }}
          isAnimationActive
          animationDuration={700}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
