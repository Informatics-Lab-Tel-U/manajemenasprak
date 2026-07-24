'use client';

import { Line, LineChart, ReferenceLine, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { HeartbeatPoint } from '@/hooks/useHeartbeatLog';

interface ResponseTimeChartProps {
  data: HeartbeatPoint[];
  compact?: boolean;
}

const chartConfig = {
  response_time: {
    label: "Response Time (ms)",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const SPIKE_THRESHOLD = 800;

export function ResponseTimeChart({ data, compact = false }: ResponseTimeChartProps) {
  // Filter out nulls for rendering
  const chartData = data.map(d => ({
    time: new Date(d.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: d.response_time_ms ?? 0,
    isSpike: (d.response_time_ms ?? 0) > SPIKE_THRESHOLD
  }));

  if (compact) {
    return (
      <div className="h-[40px] w-full mt-2">
        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
          <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <ReferenceLine y={SPIKE_THRESHOLD} stroke="hsl(var(--destructive))" strokeDasharray="3 3" opacity={0.5} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-response_time)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="time" 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            className="text-xs"
          />
          <YAxis 
            tickLine={false} 
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <ReferenceLine y={SPIKE_THRESHOLD} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Spike Threshold', fill: 'hsl(var(--destructive))', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-response_time)"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.isSpike) {
                return <circle key={`dot-${payload.time}`} cx={cx} cy={cy} r={4} fill="hsl(var(--destructive))" stroke="none" />;
              }
              return <circle key={`dot-${payload.time}`} cx={cx} cy={cy} r={2} fill="var(--color-response_time)" stroke="none" opacity={0} />;
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
