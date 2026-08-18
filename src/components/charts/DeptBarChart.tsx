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
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: textColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#12151F' : '#FFFFFF',
            border: `1px solid ${theme === 'dark' ? '#1E2230' : '#E4E6EF'}`,
            borderRadius: 10,
            fontSize: 12
          }}
          cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
