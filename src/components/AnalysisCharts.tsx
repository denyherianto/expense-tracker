'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const COLORS = ['#18181b', '#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

interface ChartData {
    periodData: { name: string; total: number }[];
    categoryData: { name: string; value: number }[];
    itemData: { name: string; value: number }[];
}

export function AnalysisCharts({ data }: { data: ChartData }) {
    return (
        <div className="space-y-4">
            <Card className="border-zinc-200/60 shadow-subtle rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-zinc-900">Spending Report</CardTitle>
                    <CardDescription className="text-zinc-500">Daily summary (This Month)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.periodData}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#a1a1aa"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#a1a1aa"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `Rp${value / 1000}k`}
                                />
                                <Tooltip
                                    formatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(value ?? 0))}
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7' }}
                                />
                                <Bar dataKey="total" fill="#18181b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-zinc-200/60 shadow-subtle rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-zinc-900">Categories</CardTitle>
                    <CardDescription className="text-zinc-500">Breakdown by category</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(value ?? 0))}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-4">
                        {data.categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="truncate flex-1 text-zinc-700">{entry.name}</span>
                                <span className="text-zinc-400">{((entry.value / data.categoryData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-zinc-200/60 shadow-subtle rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-medium text-zinc-900">Top Items</CardTitle>
                    <CardDescription className="text-zinc-500">Highest spending per item</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.itemData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600">
                                        {index + 1}
                                    </div>
                                    <div className="font-medium truncate text-sm text-zinc-900">{item.name}</div>
                                </div>
                                <div className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.value)}
                                </div>
                            </div>
                        ))}
                        {data.itemData.length === 0 && (
                            <div className="text-center text-sm text-zinc-500 py-4">No items for this period.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
