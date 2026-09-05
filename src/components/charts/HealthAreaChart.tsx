import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTheme } from '../../context/ThemeContext'

export default function HealthAreaChart({ data, height = 280 }: { data: Array<{ month: string; health: number }>; height?: number }) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#64748B'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
            <stop offset="60%" stopColor="#10B981" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: textColor, fontWeight: 500 }}
          axisLine={{ stroke: gridColor }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: textColor }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? 'rgba(14, 19, 31, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'}`,
            borderRadius: 14,
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)',
            fontSize: 12,
            padding: '8px 12px'
          }}
        />
        <Area
          type="monotone"
          dataKey="health"
          stroke="#10B981"
          strokeWidth={2.5}
          fill="url(#healthGradient)"
          name="Org Health"
          dot={{ r: 3, fill: '#10B981', strokeWidth: 2, stroke: theme === 'dark' ? '#0E131F' : '#FFFFFF' }}
          activeDot={{ r: 5, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
