import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useTheme } from '../../context/ThemeContext'

interface Series {
  key: string
  color: string
  label: string
}

interface DeptBarChartProps {
  data: Array<Record<string, string | number>>
  xKey: string
  series: Series[]
  height?: number
}

export default function DeptBarChart({ data, xKey, series, height = 280 }: DeptBarChartProps) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.5)' : '#64748B'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey={xKey}
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
          cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)' }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            radius={[6, 6, 2, 2]}
            maxBarSize={32}
            animationDuration={800}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
