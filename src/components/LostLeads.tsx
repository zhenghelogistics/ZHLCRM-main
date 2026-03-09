import React from 'react';
import { Lead, LeadStatus } from '../types';
import { GhostIcon, XCircleIcon } from './Icons';

interface LostLeadsProps {
    leads: Lead[];
}

const LostLeads: React.FC<LostLeadsProps> = ({ leads }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    if (leads.length === 0) return null;

    const sortedLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Lost Leads</h2>
            <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                 <ul role="list" className="divide-y divide-slate-100">
                    {sortedLeads.map((lead) => {
                        const isGhosted = lead.status === LeadStatus.LOST_GHOSTED;
                        return (
                             <li key={lead.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {isGhosted ? 
                                            <GhostIcon className="h-6 w-6 text-red-500"/> :
                                            <XCircleIcon className="h-6 w-6 text-slate-400"/>
                                        }
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{lead.customer_name}</p>
                                            <p className="text-sm text-slate-500">
                                                {isGhosted ? 'Ghosted' : 'Rejected'} on: {new Date(lead.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`text-sm font-semibold ${isGhosted ? 'text-red-600' : 'text-slate-500'}`}>
                                        {formatCurrency(lead.quoted_price)}
                                    </p>
                                </div>
                                {!isGhosted && lead.notes && (
                                    <div className="mt-2 pl-9">
                                        <p className="text-xs text-slate-600 p-2 bg-slate-100 rounded-md">
                                            <span className="font-semibold">Reason:</span> {lead.notes}
                                        </p>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default LostLeads;