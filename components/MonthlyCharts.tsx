
import React, { useMemo } from 'react';
import { Lead, LeadStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'https://esm.sh/recharts@2.12.7';

interface MonthlyChartsProps {
    leads: Lead[];
}

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-4">
        <h3 className="text-md font-semibold text-slate-200 mb-4">{title}</h3>
        <div style={{ width: '100%', height: 300 }}>
            {children}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-2 rounded-md shadow-lg">
        <p className="label text-slate-200">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
             <p key={index} style={{ color: pld.color }}>
                {`${pld.name}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pld.value)}`}
            </p>
        ))}
      </div>
    );
  }

  return null;
};

const MonthlyCharts: React.FC<MonthlyChartsProps> = ({ leads }) => {
    
    const revenueData = useMemo(() => {
        const won = leads.filter(l => l.status === LeadStatus.WON).reduce((sum, l) => sum + l.quoted_price, 0);
        const lost = leads.filter(l => l.status.startsWith('LOST')).reduce((sum, l) => sum + l.quoted_price, 0);
        return [{ name: 'Revenue', Won: won, Lost: lost }];
    }, [leads]);

    const lossReasonData = useMemo(() => {
        const rejected = leads.filter(l => l.status === LeadStatus.LOST_REJECTED).length;
        const ghosted = leads.filter(l => l.status === LeadStatus.LOST_GHOSTED).length;
        return [
            { name: 'Rejected', value: rejected },
            { name: 'Ghosted', value: ghosted },
        ].filter(d => d.value > 0);
    }, [leads]);

    const industryData = useMemo(() => {
        const industryMap = new Map<string, number>();
        leads.forEach(lead => {
            if (lead.status === LeadStatus.WON) {
                const current = industryMap.get(lead.industry) || 0;
                industryMap.set(lead.industry, current + lead.quoted_price);
            }
        });
        return Array.from(industryMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [leads]);
    
    const COLORS = ['#ef4444', '#a8a29e']; // Red-500, Stone-400
    const textAndGridColor = '#94a3b8'; // slate-400

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
                 <ChartContainer title="Revenue by Industry (Won Deals)">
                    <ResponsiveContainer>
                        <BarChart data={industryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis type="number" stroke={textAndGridColor} tick={{ fill: textAndGridColor }} tickFormatter={(value) => `$${(value as number / 1000)}k`} />
                            <YAxis type="category" dataKey="name" stroke={textAndGridColor} tick={{ fill: textAndGridColor }} width={100} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(71, 85, 105, 0.5)' }} />
                            <Legend wrapperStyle={{ color: textAndGridColor }} />
                            <Bar dataKey="value" name="Revenue Won" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
            <ChartContainer title="Revenue: Won vs. Lost">
                <ResponsiveContainer>
                    <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569"/>
                        <XAxis dataKey="name" stroke={textAndGridColor} tick={{ fill: textAndGridColor }} />
                        <YAxis stroke={textAndGridColor} tick={{ fill: textAndGridColor }} tickFormatter={(value) => `$${(value as number / 1000)}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(71, 85, 105, 0.5)' }} />
                        <Legend wrapperStyle={{ color: textAndGridColor }} />
                        <Bar dataKey="Won" fill="#10b981" />
                        <Bar dataKey="Lost" fill="#f43f5e" />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="Loss Reason Breakdown">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={lossReasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label={{ fill: textAndGridColor }}>
                            {lossReasonData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: textAndGridColor }} />
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
};

export default MonthlyCharts;
