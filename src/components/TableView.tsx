import React, { useState, useMemo, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { ArrowUpIcon, ArrowDownIcon, CheckCircleIcon, TrashIcon, XCircleIcon, TrophyIcon, SendIcon, LoaderIcon } from './Icons';
import LostReasonModal from './LostReasonModal';

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
        <th scope="col" className={`py-3.5 px-3 text-left text-sm font-semibold text-slate-700 cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                <span>{label}</span>
                {isSorted && (
                    sortDirection === 'desc'
                        ? <ArrowDownIcon className="ml-2 h-4 w-4 text-slate-500" />
                        : <ArrowUpIcon className="ml-2 h-4 w-4 text-slate-500" />
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
        <td className="py-4 px-3 text-sm">
            <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleBlur}
                placeholder="Add a note..."
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-slate-600 placeholder:text-slate-400"
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
        <td className="whitespace-nowrap py-4 px-3 text-sm font-medium text-slate-700">
            <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-24 bg-transparent border-none p-0 focus:ring-0 focus:bg-slate-100 rounded"
                aria-label={`Quoted price for ${lead.customer_name}`}
            />
            {lead.quoted_price === 0 && <span className="text-xs text-purple-600 ml-1">TBD</span>}
        </td>
    );
};

const STATUS_STYLES: Record<LeadStatus, string> = {
    [LeadStatus.QUOTE_SENT]: 'bg-blue-100 text-blue-800',
    [LeadStatus.IN_DISCUSSION]: 'bg-amber-100 text-amber-800',
    [LeadStatus.WON]: 'bg-green-100 text-green-800',
    [LeadStatus.LOST_GHOSTED]: 'bg-red-100 text-red-800',
    [LeadStatus.LOST_REJECTED]: 'bg-red-100 text-red-800',
};

const TableView: React.FC<TableViewProps> = ({ leads, onMarkResponded, onMarkWon, onMarkLost, onDelete, onUpdateNotes, onUpdateLeadPrice, onNudgeSent }) => {
    const { items: sortedLeads, requestSort, sortKey, sortDirection } = useSortableData(leads);
    const [lostModalLeadId, setLostModalLeadId] = useState<string | null>(null);

    const isNudgeReady = (lead: Lead) => new Date(lead.next_follow_up) <= new Date();
    const isActive = (lead: Lead) => lead.status === LeadStatus.QUOTE_SENT || lead.status === LeadStatus.IN_DISCUSSION;

    return (
        <>
            <LostReasonModal
                isOpen={lostModalLeadId !== null}
                onClose={() => setLostModalLeadId(null)}
                onSubmit={(reason) => {
                    if (lostModalLeadId) {
                        onMarkLost(lostModalLeadId, reason);
                        setLostModalLeadId(null);
                    }
                }}
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-700">Customer</th>
                            <SortableHeader sortKey="lead_score" label="Score" currentSortKey={sortKey} sortDirection={sortDirection} requestSort={requestSort} />
                            <SortableHeader sortKey="quoted_price" label="Price (RM)" currentSortKey={sortKey} sortDirection={sortDirection} requestSort={requestSort} />
                            <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Industry</th>
                            <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Status</th>
                            <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Stage</th>
                            <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700 min-w-[180px]">Notes</th>
                            <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {sortedLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                                    <div className="font-medium text-slate-900">{lead.customer_name}</div>
                                    {lead.customer_email && <div className="text-xs text-slate-400">{lead.customer_email}</div>}
                                </td>
                                <td className="whitespace-nowrap py-4 px-3 text-sm">
                                    <span className="font-bold text-slate-700">{lead.lead_score}</span>
                                    <span className="text-slate-400">/10</span>
                                </td>
                                <PriceCell lead={lead} onUpdatePrice={onUpdateLeadPrice} />
                                <td className="whitespace-nowrap py-4 px-3 text-sm text-slate-600">{lead.industry}</td>
                                <td className="whitespace-nowrap py-4 px-3 text-sm">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[lead.status]}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap py-4 px-3 text-sm text-slate-600">{lead.stage}</td>
                                <NotesCell lead={lead} onUpdateNotes={onUpdateNotes} />
                                <td className="whitespace-nowrap py-4 px-3 text-sm">
                                    <div className="flex items-center gap-1">
                                        {isActive(lead) && isNudgeReady(lead) && (
                                            <button
                                                onClick={() => onNudgeSent(lead.id)}
                                                title="Mark Nudge Sent"
                                                className="p-1.5 rounded-md text-orange-500 hover:bg-orange-50 transition-colors"
                                            >
                                                <SendIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        {lead.status === LeadStatus.QUOTE_SENT && (
                                            <button
                                                onClick={() => onMarkResponded(lead.id)}
                                                title="Mark as Responded"
                                                className="p-1.5 rounded-md text-teal-500 hover:bg-teal-50 transition-colors"
                                            >
                                                <CheckCircleIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        {lead.status === LeadStatus.IN_DISCUSSION && (
                                            <button
                                                onClick={() => onMarkWon(lead.id)}
                                                title="Mark as Won"
                                                className="p-1.5 rounded-md text-green-500 hover:bg-green-50 transition-colors"
                                            >
                                                <TrophyIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        {isActive(lead) && (
                                            <button
                                                onClick={() => setLostModalLeadId(lead.id)}
                                                title="Mark as Lost"
                                                className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors"
                                            >
                                                <XCircleIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onDelete(lead.id)}
                                            title="Delete Lead"
                                            className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sortedLeads.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                                    No leads to display.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default TableView;
