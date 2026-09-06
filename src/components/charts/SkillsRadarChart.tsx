import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useTheme } from '../../context/ThemeContext'

export default function SkillsRadarChart({ data, height = 300 }: { data: Array<{ metric: string; value: number }>; height?: number }) {
  const { theme } = useTheme()
  const textColor = theme === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={gridColor} />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: textColor }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: textColor }} />
        <Radar name="Average" dataKey="value" stroke="#6C5CE7" fill="#6C5CE7" fillOpacity={0.35} />
        <Tooltip
          contentStyle={{
            background: theme === 'dark' ? '#12151F' : '#FFFFFF',
            border: `1px solid ${theme === 'dark' ? '#1E2230' : '#E4E6EF'}`,
            borderRadius: 10,
            fontSize: 12
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
