'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#64748b'];

interface ChartData {
    periodData: { name: string; total: number }[];
    categoryData: { name: string; value: number }[];
    itemData: { name: string; value: number }[];
}

export function AnalysisCharts({ data }: { data: ChartData }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Laporan Pengeluaran</CardTitle>
                    <CardDescription>Ringkasan harian (Bulan Ini)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.periodData}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `Rp${value / 1000}k`}
                                />
                                <Tooltip
                                    formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Kategori</CardTitle>
                    <CardDescription>Perincian per kategori</CardDescription>
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
                                    formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-4">
                        {data.categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="truncate flex-1">{entry.name}</span>
                                <span className="text-muted-foreground">{((entry.value / data.categoryData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Item Teratas</CardTitle>
                    <CardDescription>Pengeluaran tertinggi per item</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.itemData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-muted text-xs font-medium">
                                        {index + 1}
                                    </div>
                                    <div className="font-medium truncate text-sm">{item.name}</div>
                                </div>
                                <div className="text-sm font-semibold whitespace-nowrap">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.value)}
                                </div>
                            </div>
                        ))}
                        {data.itemData.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground py-4">Tidak ada item untuk periode ini.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
