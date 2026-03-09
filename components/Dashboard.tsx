
import React from 'react';
import { DollarSignIcon, BarChartIcon, TrendingDownIcon, TrophyIcon, ArchiveIcon } from './Icons';

interface DashboardProps {
    projectedRevenue: number;
    wonRevenue: number;
    revenueLost: number;
    activeLeadsCount: number;
    onOpenArchiveModal: () => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-4 flex items-center space-x-4">
        <div className={`rounded-full p-3 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ projectedRevenue, wonRevenue, revenueLost, activeLeadsCount, onOpenArchiveModal }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-200">Pipeline Overview</h2>
                <button 
                    onClick={onOpenArchiveModal}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <ArchiveIcon className="h-5 w-5 mr-2" />
                    Archive Current Month
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Revenue Won" 
                    value={formatCurrency(wonRevenue)} 
                    icon={<TrophyIcon className="h-6 w-6 text-white"/>}
                    color="bg-green-500"
                />
                <StatCard 
                    title="Projected Revenue" 
                    value={formatCurrency(projectedRevenue)} 
                    icon={<DollarSignIcon className="h-6 w-6 text-white"/>}
                    color="bg-blue-500"
                />
                <StatCard 
                    title="Active Leads" 
                    value={activeLeadsCount.toString()} 
                    icon={<BarChartIcon className="h-6 w-6 text-white"/>}
                    color="bg-indigo-500"
                />
                 <StatCard 
                    title="Total Revenue Lost" 
                    value={formatCurrency(revenueLost)} 
                    icon={<TrendingDownIcon className="h-6 w-6 text-white"/>}
                    color="bg-red-500"
                />
            </div>
        </div>
    );
};

export default Dashboard;
