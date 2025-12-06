'use client'

import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface OrdersChartProps {
  data: {
    date: string
    orders: number
  }[]
  title: string
  subtitle: string
  last7Days: string
  last30Days: string
  last3Months: string
}

type TimeRange = '7days' | '30days' | '3months'

export function OrdersChart({
  data,
  title,
  subtitle,
  last7Days,
  last30Days,
  last3Months
}: OrdersChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days')

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date()
    const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    return data.filter(item => new Date(item.date) >= cutoff)
  }

  const filteredData = getFilteredData()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === '3months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('3months')}
            >
              {last3Months}
            </Button>
            <Button
              variant={timeRange === '30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30days')}
            >
              {last30Days}
            </Button>
            <Button
              variant={timeRange === '7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7days')}
            >
              {last7Days}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }}
            />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
              labelFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })
              }}
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorOrders)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
