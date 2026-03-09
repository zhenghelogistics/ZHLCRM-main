
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { PlusCircleIcon } from './Icons';

interface ManualLeadInputProps {
    onAddLead: (leadData: Omit<Lead, 'id' | 'stage' | 'next_follow_up' | 'riskLevel' | 'respondedAtStage'> & { respondedAtStage?: string | null }) => void;
}

const ManualLeadInput: React.FC<ManualLeadInputProps> = ({ onAddLead }) => {
    const [customerName, setCustomerName] = useState('');
    const [quotedPrice, setQuotedPrice] = useState('');
    const [industry, setIndustry] = useState('');
    const [leadScore, setLeadScore] = useState('5');
    const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<LeadStatus>(LeadStatus.WON);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName || !quotedPrice || !industry) {
            return;
        }

        onAddLead({
            customer_name: customerName,
            quoted_price: parseFloat(quotedPrice),
            industry,
            lead_score: parseInt(leadScore, 10),
            createdAt: new Date(createdAt).toISOString(),
            status,
            notes,
            respondedAtStage: 'Manual Entry'
        });

        // Reset form
        setCustomerName('');
        setQuotedPrice('');
        setIndustry('');
        setLeadScore('5');
        setCreatedAt(new Date().toISOString().split('T')[0]);
        setStatus(LeadStatus.WON);
        setNotes('');
    };

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                <PlusCircleIcon className="h-6 w-6 mr-3 text-slate-400"/>
                Log a Manual Entry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="customer-name" className="block text-sm font-medium text-slate-300 mb-1">Customer Name</label>
                        <input type="text" id="customer-name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200 placeholder:text-slate-500" required placeholder="e.g., Pulau Sambu Singapore" />
                    </div>
                    <div>
                        <label htmlFor="quoted-price" className="block text-sm font-medium text-slate-300 mb-1">Quoted Price</label>
                        <input type="number" id="quoted-price" value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200 placeholder:text-slate-500" required placeholder="e.g., 45000" />
                    </div>
                    <div>
                        <label htmlFor="industry" className="block text-sm font-medium text-slate-300 mb-1">Industry</label>
                        <input type="text" id="industry" value={industry} onChange={e => setIndustry(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200 placeholder:text-slate-500" required placeholder="e.g., Commodities" />
                    </div>
                    <div>
                        <label htmlFor="lead-score" className="block text-sm font-medium text-slate-300 mb-1">Lead Score (1-10)</label>
                        <input type="number" id="lead-score" value={leadScore} onChange={e => setLeadScore(e.target.value)} min="1" max="10" className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200" required />
                    </div>
                     <div>
                        <label htmlFor="created-at" className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                        <input type="date" id="created-at" value={createdAt} onChange={e => setCreatedAt(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200" required />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                        <select id="status" value={status} onChange={e => setStatus(e.target.value as LeadStatus)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200">
                            <option value={LeadStatus.WON}>Won</option>
                            <option value={LeadStatus.LOST_REJECTED}>Lost (Rejected)</option>
                            <option value={LeadStatus.LOST_GHOSTED}>LOST: GHOSTED</option>
                        </select>
                    </div>
                </div>
                <div>
                     <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">Notes / Reason for Loss</label>
                     <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200 placeholder:text-slate-500" placeholder="e.g., Major coconut cream shipment" rows={2}></textarea>
                </div>
                <button type="submit" className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition">
                    Save Lead
                </button>
            </form>
        </div>
    );
};

export default ManualLeadInput;
