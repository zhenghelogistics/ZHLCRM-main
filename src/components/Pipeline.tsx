import React from 'react';
import { Lead } from '../types';
import LeadCard from './LeadCard';
import TableView from './TableView';
import { InboxIcon, LayoutGridIcon, ListIcon } from './Icons';
import { ViewMode } from '../App';

interface PipelineProps {
    leads: Lead[];
    onMarkResponded: (id: string) => void;
    onMarkWon: (id: string) => void;
    onMarkLost: (id: string, reason: string) => void;
    onDelete: (id: string) => void;
    onUpdateNotes: (id: string, notes: string) => void;
    onUpdateLeadPrice: (id: string, price: number) => void;
    onNudgeSent: (id: string) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

const Pipeline: React.FC<PipelineProps> = ({ leads, onMarkResponded, onMarkWon, onMarkLost, onDelete, onUpdateNotes, onUpdateLeadPrice, onNudgeSent, viewMode, onViewModeChange }) => {
    const sortedLeads = [...leads].sort((a, b) => b.lead_score - a.lead_score);
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Active Pipeline</h2>
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                        onClick={() => onViewModeChange('card')}
                        className={`px-3 py-1 text-sm font-medium rounded-md flex items-center transition-colors ${viewMode === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        aria-pressed={viewMode === 'card'}
                    >
                        <LayoutGridIcon className="h-5 w-5 mr-1.5"/>
                        Cards
                    </button>
                    <button 
                        onClick={() => onViewModeChange('table')}
                        className={`px-3 py-1 text-sm font-medium rounded-md flex items-center transition-colors ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                        aria-pressed={viewMode === 'table'}
                    >
                        <ListIcon className="h-5 w-5 mr-1.5"/>
                        Table
                    </button>
                </div>
            </div>

            {leads.length > 0 ? (
                <div>
                    {viewMode === 'card' ? (
                         <div className="space-y-4">
                            {sortedLeads.map(lead => (
                                <LeadCard 
                                    key={lead.id} 
                                    lead={lead} 
                                    onMarkResponded={onMarkResponded}
                                    onMarkWon={onMarkWon}
                                    onMarkLost={onMarkLost}
                                    onDelete={onDelete}
                                    onUpdateNotes={onUpdateNotes}
                                    onUpdateLeadPrice={onUpdateLeadPrice}
                                    onNudgeSent={onNudgeSent}
                                />
                            ))}
                        </div>
                    ) : (
                        <TableView 
                            leads={leads}
                            onMarkResponded={onMarkResponded}
                            onMarkWon={onMarkWon}
                            onMarkLost={onMarkLost}
                            onDelete={onDelete}
                            onUpdateNotes={onUpdateNotes}
                            onUpdateLeadPrice={onUpdateLeadPrice}
                            onNudgeSent={onNudgeSent}
                        />
                    )}
                </div>
            ) : (
                <div className="text-center py-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm">
                    <InboxIcon className="mx-auto h-12 w-12 text-slate-400"/>
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No active leads</h3>
                    <p className="mt-1 text-sm text-slate-500">Process an email to add a new lead to the pipeline.</p>
                </div>
            )}
        </div>
    );
};

export default Pipeline;