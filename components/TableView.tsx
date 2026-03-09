

import React, { useState, useMemo, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
// FIX: Removed LoaderIcon as it is no longer used
import { ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, TrashIcon, XCircleIcon, TrophyIcon, SendIcon } from './Icons';
import LostReasonModal from './LostReasonModal';
// FIX: Removed import from `services/geminiService.ts` as the file is not a module and the functionality has been deprecated.

type SortKey = 'lead_score' | 'quoted_price' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface TableViewProps {
    leads: Lead[];
    onMarkResponded: (id: string) => void;
    onMarkWon: (id: string) => void;
    onMarkLost: (id: string, reason: string) => void;
    onDelete: (id: string) => void;
    onUpdateNotes: (id: string, notes: string) => void;
    onUpdateLeadPrice: (id: string, price: number) => void;
    onNudgeSent: (id: string) => void;
}

const useSortableData = (items: Lead[], initialSortKey: SortKey = 'lead_score') => {
    const [sortKey, setSortKey] = useState<SortKey>(initialSortKey);
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        sortableItems.sort((a, b) => {
            if (a[sortKey] < b[sortKey]) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (a[sortKey] > b[sortKey]) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sortableItems;
    }, [items, sortKey, sortDirection]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'desc';
        if (sortKey === key && sortDirection === 'desc') {
            direction = 'asc';
        }
        setSortKey(key);
        setSortDirection(direction);
    };

    return { items: sortedItems, requestSort, sortKey, sortDirection };
};


const SortableHeader: React.FC<{
    sortKey: SortKey;
    label: string;
    currentSortKey: SortKey;
    sortDirection: SortDirection;
    requestSort: (key: SortKey) => void;
    className?: string;
}> = ({ sortKey, label, currentSortKey, sortDirection, requestSort, className }) => {
    const isSorted = currentSortKey === sortKey;
    return (
        <th scope="col" className={`py-3.5 px-3 text-left text-sm font-semibold text-slate-200 cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                <span>{label}</span>
                {isSorted && (
                    sortDirection === 'desc' 
                        ? <ArrowDownIcon className="ml-2 h-4 w-4 text-slate-400" /> 
                        : <ArrowUpIcon className="ml-2 h-4 w-4 text-slate-400" />
                )}
            </div>
        </th>
    );
};

const NotesCell: React.FC<{ lead: Lead; onUpdateNotes: (id: string, notes: string) => void }> = ({ lead, onUpdateNotes }) => {
    const [notes, setNotes] = useState(lead.notes || '');
    const handleBlur = () => {
        if (notes !== (lead.notes || '')) {
            onUpdateNotes(lead.id, notes);
        }
    };
    return (
        <td className="whitespace-nowrap py-4 px-3 text-sm">
            <input 
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleBlur}
                placeholder="Add a note..."
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-400 placeholder:text-slate-500"
            />
        </td>
    );
};

const PriceCell: React.FC<{ lead: Lead; onUpdatePrice: (id: string, price: number) => void }> = ({ lead, onUpdatePrice }) => {
    const [price, setPrice] = useState(lead.quoted_price.toString());
    
    useEffect(() => {
        setPrice(lead.quoted_price.toString());
    }, [lead.quoted_price]);
    
    const handleBlur = () => {
        const newPrice = parseFloat(price);
        if (!isNaN(newPrice) && newPrice !== lead.quoted_price) {
            onUpdatePrice(lead.id, newPrice);
        } else {
            setPrice(lead.quoted_price.toString());
        }
    };
    
    return (
         <td className="whitespace-nowrap py-4 px-3 text-sm font-medium text-slate-300">
            <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-24 bg-transparent border-none p-0 focus:ring-0 focus:bg-slate-700/50 rounded"
                aria-label={`Quoted price for ${lead.customer_name}`}
            />
             {lead.quoted_price === 0 && <span className="text-xs text-purple-400 ml-1">TBD</span>}
        </td>
    )
}


const TableView: React.FC<TableViewProps> = ({ leads, onMarkResponded, onMarkWon, onMarkLost, onDelete, onUpdateNotes, onUpdateLeadPrice, onNudgeSent }) => {
    const { items, requestSort, sortKey, sortDirection } = useSortableData(leads);
    const [lostModalLead, setLostModalLead] = useState<Lead | null>(null);
    // FIX: Removed nudgingLeadId state as it is no longer used with synchronous mailto link generation.

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const handleLostSubmit = (reason: string) => {
        if (lostModalLead) {
            onMarkLost(lostModalLead.id, reason);
            setLostModalLead(null);
        }
    };
    
    // FIX: Replaced Gemini-based email generation with a simple, client-side mailto link.
    const handleNudgeClick = (lead: Lead) => {
        const subject = `Following up on your quote - Zhenghe Logistics`;
        const body = `Dear ${lead.customer_name.split(' ')[0] || ''},\n\nJust wanted to follow up on the recent quote we sent over. Please let us know if you have any questions.\n\nBest regards,`;
        const mailtoLink = `mailto:${lead.customer_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
        onNudgeSent(lead.id);
    };

    const statusClasses = {
        [LeadStatus.QUOTE_SENT]: "bg-blue-500/20 text-blue-300",
        [LeadStatus.IN_DISCUSSION]: "bg-teal-500/20 text-teal-300",
        [LeadStatus.WON]: "bg-green-500/20 text-green-300",
        [LeadStatus.LOST_GHOSTED]: "bg-red-500/20 text-red-300",
        [LeadStatus.LOST_REJECTED]: "bg-slate-500/20 text-slate-300"
    };

    const borderClass = {
        [LeadStatus.QUOTE_SENT]: "border-l-4 border-blue-500",
        [LeadStatus.IN_DISCUSSION]: "border-l-4 border-teal-500",
        [LeadStatus.WON]: "border-l-4 border-green-500",
        [LeadStatus.LOST_GHOSTED]: "border-l-4 border-red-500",
        [LeadStatus.LOST_REJECTED]: "border-l-4 border-slate-500",
    }


    return (
        <>
            <LostReasonModal 
                isOpen={!!lostModalLead}
                onClose={() => setLostModalLead(null)}
                onSubmit={handleLostSubmit}
            />
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800/50">
                        <thead className="bg-transparent">
                            <tr>
                                <SortableHeader sortKey="lead_score" label="Score" currentSortKey={sortKey} sortDirection={sortDirection} requestSort={requestSort} className="pl-4 sm:pl-6" />
                                <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-200">Customer</th>
                                <SortableHeader sortKey="quoted_price" label="Price" currentSortKey={sortKey} sortDirection={sortDirection} requestSort={requestSort} />
                                <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-200">Stage</th>
                                 <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-200">Status</th>
                                <SortableHeader sortKey="createdAt" label="Date" currentSortKey={sortKey} sortDirection={sortDirection} requestSort={requestSort} />
                                <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-200">Notes</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {items.map((lead) => (
                                <tr key={lead.id} className={`hover:bg-zinc-900/60 ${borderClass[lead.status]}`}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-500/20 font-bold text-indigo-300 text-base">
                                            {lead.lead_score}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap py-4 px-3 text-sm">
                                        <div className="font-medium text-slate-200">{lead.customer_name}</div>
                                        <div className="text-slate-400">{lead.industry}</div>
                                    </td>
                                    <PriceCell lead={lead} onUpdatePrice={onUpdateLeadPrice} />
                                    <td className="whitespace-nowrap py-4 px-3 text-sm text-slate-400">{lead.stage}</td>
                                    <td className="whitespace-nowrap py-4 px-3 text-sm text-slate-400">
                                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClasses[lead.status]}`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap py-4 px-3 text-sm text-slate-400">{formatDate(lead.createdAt)}</td>
                                    <NotesCell lead={lead} onUpdateNotes={onUpdateNotes} />
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <div className="flex items-center justify-end space-x-1">
                                            {lead.status === LeadStatus.QUOTE_SENT && new Date(lead.next_follow_up) <= new Date() && (
                                                <button 
                                                    onClick={() => handleNudgeClick(lead)}
                                                    // FIX: Removed disabled state and loader icon as the action is now synchronous.
                                                    className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/20 rounded-md transition" 
                                                    title="Send Nudge">
                                                    <SendIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                            {lead.status === LeadStatus.QUOTE_SENT && (
                                                <button onClick={() => onMarkResponded(lead.id)} className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/20 rounded-md transition" title="Mark Responded">
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                            {lead.status === LeadStatus.IN_DISCUSSION && (
                                                 <button onClick={() => onMarkWon(lead.id)} className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-md transition" title="Mark as Won">
                                                    <TrophyIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                            {(lead.status === LeadStatus.QUOTE_SENT || lead.status === LeadStatus.IN_DISCUSSION) && (
                                                <button onClick={() => setLostModalLead(lead)} className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-500/20 rounded-md transition" title="Mark as Lost">
                                                    <XCircleIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                            <button onClick={() => onDelete(lead.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/20 rounded-md transition" title="Delete Lead">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default TableView;