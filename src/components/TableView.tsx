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
        <td className="whitespace-nowrap py-4 px-3 text-sm">
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
    )
}


const TableView: React.FC<TableViewProps> = ({ leads, onMarkRespon