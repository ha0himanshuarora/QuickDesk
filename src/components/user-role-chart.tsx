
"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

const chartConfig = {
  users: {
    label: "Users",
  },
  admins: {
    label: "Admins",
    color: "hsl(var(--chart-1))",
  },
  agents: {
    label: "Support Agents",
    color: "hsl(var(--chart-2))",
  },
  endusers: {
    label: "End-Users",
    color: "hsl(var(--chart-3))",
  },
}

interface UserRoleChartProps {
    data: { name: string, value: number }[];
}

export function UserRoleChart({ data }: UserRoleChartProps) {
    const totalUsers = React.useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.value, 0)
    }, [data])

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[300px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          strokeWidth={5}
        >
         <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {totalUsers.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Users
                    </tspan>
                  </text>
                )
              }
            }}
          />
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
           ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
