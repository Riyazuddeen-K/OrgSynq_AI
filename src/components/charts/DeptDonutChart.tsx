import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from '../../context/ThemeContext'

interface DonutDatum {
  name: string
  value: number
  color: string
}

export default function DeptDonutChart({ data, height = 300 }: { data: DonutDatum[]; height?: number }) {
  const { theme } = useTheme()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={3} stroke="none">
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#12151F' : '#FFFFFF',
            border: `1px solid ${theme === 'dark' ? '#1E2230' : '#E4E6EF'}`,
            borderRadius: 10,
            fontSize: 12
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) => <span style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
