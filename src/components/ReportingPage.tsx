import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus } from '../types';
import { TrashIcon, DownloadIcon, BarChart2Icon, CheckCircleIcon, XCircleIcon, GhostIcon, TrophyIcon } from './Icons';
import ManualLeadInput from './ManualLeadInput';

interface ReportingPageProps {
    allLeads: Lead[];
    onAddLead: (leadData: Omit<Lead, 'id' | 'stage' | 'next_follow_up' | 'riskLevel' | 'respondedAtStage'> & { respondedAtStage?: string | null }) => void;
    onUpdateNotes: (id: string, notes: string) => void;
    onDelete: (id: string) => void;
    onUpdateDate: (id: string, newDate: string) => void;
}

type FilterOption = 'all' | 'T+3h' | 'T+6h' | 'T-24h (Nurture)' | 'responded' | 'won' | 'ghosted' | 'rejected';

const FilterButton: React.FC<{ label: string, filter: FilterOption, activeFilter: FilterOption, onClick: (filter: FilterOption) => void }> = ({ label, filter, activeFilter, onClick }) => (
    <button 
        onClick={() => onClick(filter)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border ${
            activeFilter === filter 
            ? 'bg-blue-600 text-white border-blue-600' 
            : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
        }`}
    >
        {label}
    </button>
);

const NotesCell: React.FC<{ lead: Lead; onUpdateNotes: (id: string, notes: string) => void }> = ({ lead, onUpdateNotes }) => {
    const [notes, setNotes] = useState(lead.notes || '');
    const handleBlur = () => {
        if (notes !== (lead.notes || '')) {
            onUpdateNotes(lead.id, notes);
        }
    };
    return (
        <td className="py-4 px-3 text-sm min-w-[200px]">
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleBlur}
                placeholder="Add a note..."
                className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md p-1 text-slate-700 text-xs resize-none placeholder:text-slate-400"
                rows={1}
            />
        </td>
    );
};

const DateCell: React.FC<{ lead: Lead; onUpdateDate: (id: string, newDate: string) => void }> = ({ lead, onUpdateDate }) => {
    const dateValue = new Date(lead.createdAt).toISOString().split('T')[0];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            onUpdateDate(lead.id, e.target.value);
        }
    };

    return (
        <td className="py-2 px-3 text-sm">
            <input
                type="date"
                value={dateValue}
                onChange={handleChange}
                className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md p-1 text-slate-700"
                aria-label={`Creation date for ${lead.customer_name}`}
            />
        </td>
    );
};

const ReportingPage: React.FC<ReportingPageProps> = ({ allLeads, onAddLead, onUpdateNotes, onDelete, onUpdateDate }) => {
    const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
    const [industryFilter, setIndustryFilter] = useState<string>('all');

    const industries = useMemo(() => {
        const industrySet = new Set(allLeads.map(lead => lead.industry));
        return Array.from(industrySet).sort();
    }, [allLeads]);

    const filteredLeads = useMemo(() => {
        let leads = [...allLeads];

        if (activeFilter !== 'all') {
            leads = leads.filter(lead => {
                switch (activeFilter) {
                    case 'responded': return lead.status === LeadStatus.IN_DISCUSSION;
                    case 'won': return lead.status === LeadStatus.WON;
                    case 'ghosted': return lead.status === LeadStatus.LOST_GHOSTED;
                    case 'rejected': return lead.status === LeadStatus.LOST_REJECTED;
                    case 'T+3h': case 'T+6h': case 'T-24h (Nurture)': return lead.stage === activeFilter && lead.status === LeadStatus.QUOTE_SENT;
                    default: return true;
                }
            });
        }

        if (industryFilter !== 'all') {
            leads = leads.filter(lead => lead.industry === industryFilter);
        }
        
        return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    }, [allLeads, activeFilter, industryFilter]);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const handleExportCSV = () => {
        const headers = ['ID', 'Customer Name', 'Quoted Price', 'Industry', 'Lead Score', 'Status', 'Stage', 'Responded At Stage', 'Risk Level', 'Date Created', 'Notes'];
        const escapeCSV = (value: any): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = filteredLeads.map(lead => [lead.id, lead.customer_name, lead.quoted_price, lead.industry, lead.lead_score, lead.status, lead.stage, lead.respondedAtStage, lead.riskLevel, new Date(lead.createdAt).toISOString(), lead.notes].map(escapeCSV).join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `zhenghe_logistics_leads_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const summary = useMemo(() => {
        const totalValue = filteredLeads.reduce((sum, lead) => sum + lead.quoted_price, 0);
        const count = filteredLeads.length;
        return { totalValue, count };
    }, [filteredLeads]);
    
    const filterMetadata = {
        'all': { icon: <BarChart2Icon className="h-5 w-5 mr-2" />, title: "All Leads" },
        'responded': { icon: <CheckCircleIcon className="h-5 w-5 mr-2" />, title: "Leads in Discussion" },
        'won': { icon: <TrophyIcon className="h-5 w-5 mr-2" />, title: "Won Leads" },
        'rejected': { icon: <XCircleIcon className="h-5 w-5 mr-2" />, title: "Rejected Leads" },
        'ghosted': { icon: <GhostIcon className="h-5 w-5 mr-2" />, title: "Ghosted Leads" },
        'T+3h': { icon: <BarChart2Icon className="h-5 w-5 mr-2" />, title: "T+3h Follow-up" },
        'T+6h': { icon: <BarChart2Icon className="h-5 w-5 mr-2" />, title: "T+6h Follow-up" },
        'T-24h (Nurture)': { icon: <BarChart2Icon className="h-5 w-5 mr-2" />, title: "Nurturing (T-24h)" },
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Reporting & Analysis</h1>
                    <p className="text-slate-500 mt-1">A complete view of all leads. Filter by stage or status to analyze performance.</p>
                </div>
                <button onClick={handleExportCSV} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-sm">
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    Export CSV
                </button>
            </div>
            
            <ManualLeadInput onAddLead={onAddLead} />

            <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center text-slate-600">
                    {filterMetadata[activeFilter].icon}
                    <p>
                        Showing <span className="font-bold text-slate-900">{summary.count} {summary.count === 1 ? 'lead' : 'leads'}</span>
                        {industryFilter !== 'all' ? ` in the "${industryFilter}" industry` : ''}
                        &nbsp;under "{filterMetadata[activeFilter].title}"
                        with a total value of <span className="font-bold text-slate-900">{formatCurrency(summary.totalValue)}</span>.
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                <FilterButton label="All Leads" filter="all" activeFilter={activeFilter} onClick={setActiveFilter} />
                <FilterButton label="T+3h Follow-up" filter="T+3h" activeFilter={activeFilter} onClick={setActiveFilter} />
                <FilterButton label="T+6h Follow-up" filter="T+6h" activeFilter={activeFilter} onClick={setActiveFilter} />
                <FilterButton label="Nurturing (T-24h)" filter="T-24h (Nurture)" activeFilter={activeFilter} onClick={setActiveFilter} />
                <FilterButton label="Responded" filter="responded" activeFilter={activeFilter} onClick={setActiveFilter} />
                <FilterButton label="Won" filter="won" activeFilter={activeFilter} onClick={setActiveFilter} />
                <FilterButton label="Rejected" filter="rejected" activeFilter={activeFilter} onClick={setActiveFilter} />
                <FilterButton label="Ghosted" filter="ghosted" activeFilter={activeFilter} onClick={setActiveFilter} />
                 <div className="relative">
                    <select
                        id="industry-filter"
                        value={industryFilter}
                        onChange={(e) => setIndustryFilter(e.target.value)}
                        className="appearance-none bg-white border border-slate-300 text-slate-700 text-sm rounded-md py-1.5 pl-3 pr-8 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                    >
                        <option value="all">All Industries</option>
                        {industries.map(industry => (
                            <option key={industry} value={industry}>{industry}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700 sm:pl-6">Customer</th>
                                <th className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Score</th>
                                <th className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Price</th>
                                <th className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Final Status</th>
                                <th className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Responded At</th>
                                <th className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Created</th>
                                <th className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Notes</th>
                                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Delete</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-slate-50">
                                    <td className="py-4 px-3 text-sm sm:pl-6">
                                        <div className="font-medium text-slate-900">{lead.customer_name}</div>
                                        <div className="text-slate-500">{lead.industry}</div>
                                    </td>
                                    <td className="py-4 px-3 text-sm text-slate-900 font-bold text-center">{lead.lead_score}</td>
                                    <td className="py-4 px-3 text-sm text-slate-600">{formatCurrency(lead.quoted_price)}</td>
                                    <td className="py-4 px-3 text-sm">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            lead.status === LeadStatus.IN_DISCUSSION ? 'bg-teal-100 text-teal-700' :
                                            lead.status === LeadStatus.WON ? 'bg-green-100 text-green-700' :
                                            lead.status === LeadStatus.LOST_GHOSTED ? 'bg-red-100 text-red-700' :
                                            lead.status === LeadStatus.LOST_REJECTED ? 'bg-slate-100 text-slate-600' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-3 text-sm text-slate-500">{lead.respondedAtStage || 'N/A'}</td>
                                    <DateCell lead={lead} onUpdateDate={onUpdateDate} />
                                    <NotesCell lead={lead} onUpdateNotes={onUpdateNotes} />
                                    <td className="py-4 pl-3 pr-4 sm:pr-6">
                                        <button onClick={() => onDelete(lead.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition" title="Delete Lead">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {filteredLeads.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm text-slate-500">No leads match the current filter.</p>
                </div>
            )}
        </div>
    );
};

export default ReportingPage;