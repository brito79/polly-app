'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PeriodData } from "@/lib/actions/analytics";

interface AnalyticsChartProps {
  title: string;
  description?: string;
  data: PeriodData[];
  dataKey?: string;
  showLegend?: boolean;
  height?: number;
  color?: string;
}

export function AnalyticsChart({ 
  title, 
  description, 
  data, 
  dataKey = "count", 
  showLegend = false, 
  height = 300,
  color = "#0ea5e9" 
}: AnalyticsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="period" 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              formatter={(value: number) => [value.toLocaleString(), title]}
              contentStyle={{ 
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              labelStyle={{ 
                fontWeight: 'bold', 
                color: '#374151' 
              }}
            />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2} 
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface MultiLineChartProps {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  lines: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  height?: number;
}

export function MultiLineChart({ 
  title, 
  description, 
  data, 
  lines, 
  xAxisKey, 
  height = 400 
}: MultiLineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                value.toLocaleString(), 
                lines.find(line => line.dataKey === name)?.name || name
              ]}
              contentStyle={{ 
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              labelStyle={{ fontWeight: 'bold', color: '#374151' }}
            />
            <Legend />
            {lines.map(line => (
              <Line 
                key={line.dataKey}
                type="monotone" 
                dataKey={line.dataKey} 
                name={line.name}
                stroke={line.color} 
                strokeWidth={2} 
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}