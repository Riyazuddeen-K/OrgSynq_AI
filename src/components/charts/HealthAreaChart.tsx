import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTheme } from '../../context/ThemeContext'

export default function HealthAreaChart({ data, height = 280 }: { data: Array<{ month: string; health: number }>; height?: number }) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#12B886" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#12B886" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: textColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#12151F' : '#FFFFFF',
            border: `1px solid ${theme === 'dark' ? '#1E2230' : '#E4E6EF'}`,
            borderRadius: 10,
            fontSize: 12
          }}
        />
        <Area type="monotone" dataKey="health" stroke="#12B886" strokeWidth={2} fill="url(#healthGradient)" name="Org Health" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
