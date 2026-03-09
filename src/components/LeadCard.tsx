import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, RiskLevel } from '../types';
import { ClockIcon, CheckCircleIcon, TrashIcon, AlertTriangleIcon, TrendingUpIcon, EyeOffIcon, MessageSquareIcon, XCircleIcon, TrophyIcon, SendIcon } from './Icons';
import LostReasonModal from './LostReasonModal';

interface LeadCardProps {
    lead: Lead;
    onMarkResponded: (id: string) => void;
    onMarkWon: (id: string) => void;
    onMarkLost: (id: string, reason: string) => void;
    onDelete: (id: string) => void;
    onUpdateNotes: (id: string, notes: string) => void;
    onUpdateLeadPrice: (id: string, price: number) => void;
    onNudgeSent: (id: string) => void;
}

const formatTimeLeft = (targetDate: string) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return "Now";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
};

const EditablePrice: React.FC<{ lead: Lead; onUpdate: (id: string, price: number) => void }> = ({ lead, onUpdate }) => {
    const [price, setPrice] = useState(lead.quoted_price.toString());
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setPrice(lead.quoted_price.toString());
    }, [lead.quoted_price]);

    const handleBlur = () => {
        setIsEditing(false);
        const newPrice = parseFloat(price);
        if (!isNaN(newPrice) && newPrice !== lead.quoted_price) {
            onUpdate(lead.id, newPrice);
        } else {
             setPrice(lead.quoted_price.toString()); // Revert if invalid or unchanged
        }
    };
    
    return (
        <div className="relative group">
            <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onBlur={handleBlur}
                onFocus={() => setIsEditing(true)}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="text-2xl font-bold text-blue-600 mt-1 bg-transparent border-none p-0 w-full focus:ring-0 focus:bg-slate-100 rounded transition-colors"
                aria-label={`Quoted price for ${lead.customer_name}`}
            />
            {!isEditing && lead.quoted_price === 0 && (
                <span className="absolute -top-5 right-0 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full border border-purple-200">
                    Price TBD
                </span>
            )}
        </div>
    );
};


const LeadCard: React.FC<LeadCardProps> = ({ lead, onMarkResponded, onMarkWon, onMarkLost, onDelete, onUpdateNotes, onUpdateLeadPrice, onNudgeSent }) => {
    const [timeLeft, setTimeLeft] = useState(formatTimeLeft(lead.next_follow_up));
    const [notes, setNotes] = useState(lead.notes || '');
    const [isLostModalOpen, setIsLostModalOpen] = useState(false);

    useEffect(() => {
        if (lead.status === LeadStatus.QUOTE_SENT) {
            const interval = setInterval(() => {
                setTimeLeft(formatTimeLeft(lead.next_follow_up));
            }, 1000 * 60);
            return () => clearInterval(interval);
        }
    }, [lead.next_follow_up, lead.status]);

    const handleNotesBlur = () => {
        if (notes !== (lead.notes || '')) {
            onUpdateNotes(lead.id, notes);
        }
    };

    const handleLostSubmit = (reason: string) => {
        onMarkLost(lead.id, reason);
        setIsLostModalOpen(false);
    };

    const handleNudgeClick = () => {
        const subject = `Following up on your quote - Zhenghe Logistics`;
        const body = `Dear ${lead.customer_name.split(' ')[0]},\n\nJust wanted to follow up on the recent quote we sent over. Please let us know if you have any questions.\n\nBest regards,`;
        const mailtoLink = `mailto:${lead.customer_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
        onNudgeSent(lead.id);
    };

    const statusClasses = {
        [LeadStatus.QUOTE_SENT]: "bg-blue-50 text-blue-700 border border-blue-200",
        [LeadStatus.IN_DISCUSSION]: "bg-teal-50 text-teal-700 border border-teal-200",
        [LeadStatus.WON]: "bg-green-50 text-green-700 border border-green-200",
        [LeadStatus.LOST_GHOSTED]: "bg-red-50 text-red-700 border border-red-200",
        [LeadStatus.LOST_REJECTED]: "bg-slate-100 text-slate-600 border border-slate-200"
    };
    
    const riskClasses = {
        [RiskLevel.LOW]: "bg-green-100 text-green-800",
        [RiskLevel.MEDIUM]: "bg-yellow-100 text-yellow-800",
        [RiskLevel.HIGH]: "bg-red-100 text-red-800"
    };

    const borderClass = {
        [LeadStatus.QUOTE_SENT]: "border-l-4 border-l-blue-500",
        [LeadStatus.IN_DISCUSSION]: "border-l-4 border-l-teal-500",
        [LeadStatus.WON]: "border-l-4 border-l-green-500",
        [LeadStatus.LOST_GHOSTED]: "border-l-4 border-l-red-500",
        [LeadStatus.LOST_REJECTED]: "border-l-4 border-l-slate-500",
    }
    
    const isNudgeReady = lead.status === LeadStatus.QUOTE_SENT && new Date(lead.next_follow_up) <= new Date();

    return (
        <>
            <LostReasonModal 
                isOpen={isLostModalOpen}
                onClose={() => setIsLostModalOpen(false)}
                onSubmit={handleLostSubmit}
            />
            <div className={`bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl p-4 transition-colors hover:shadow-md hover:bg-white shadow-sm ${borderClass[lead.status]}`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">{lead.customer_name}</h3>
                        <p className="text-sm text-slate-500">{lead.industry}</p>
                        <EditablePrice lead={lead} onUpdate={onUpdateLeadPrice} />
                    </div>
                    <div className="flex items-start space-x-2 mt-2 sm:mt-0">
                         <div className="text-center">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-50 font-bold text-indigo-600 text-lg border border-indigo-100">
                               {lead.lead_score}
                            </div>
                            <span className="text-xs font-medium text-slate-400">Score</span>
                        </div>
                        <div className="flex flex-col space-y-1 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskClasses[lead.riskLevel]}`}>
                                <AlertTriangleIcon className="h-3 w-3 mr-1.5" />
                                {lead.riskLevel} Risk
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[lead.status]}`}>
                                {lead.status}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-slate-200 my-3"></div>

                <div className="flex items-center space-x-4 text-sm text-slate-600 flex-wrap gap-y-2">
                    <div className="flex items-center">
                         <TrendingUpIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                         Stage: <span className="font-semibold ml-1 text-slate-800">{lead.stage}</span>
                    </div>
                     {lead.stage === 'T-24h (Nurture)' && (
                        <div className="flex items-center text-yellow-700 bg-yellow-100/50 px-2 py-0.5 rounded-md border border-yellow-200">
                            <EyeOffIcon className="h-4 w-4 mr-1.5" />
                            <span className="font-semibold text-xs">Potentially Ghosting</span>
                        </div>
                    )}
                    {lead.status === LeadStatus.QUOTE_SENT && (
                        <div className="flex items-center text-orange-600">
                            <ClockIcon className="h-4 w-4 mr-1.5" />
                            Next Nudge: <span className="font-semibold ml-1">{timeLeft}</span>
                        </div>
                    )}
                </div>
                
                <div className="mt-3">
                     <label className="flex items-center text-xs font-medium text-slate-500 mb-1">
                        <MessageSquareIcon className="h-3.5 w-3.5 mr-1.5"/>
                        Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        onBlur={handleNotesBlur}
                        placeholder="Add notes..."
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs transition bg-white text-slate-800 placeholder:text-slate-400"
                        rows={2}
                    />
                </div>
                
                {(lead.status === LeadStatus.QUOTE_SENT || lead.status === LeadStatus.IN_DISCUSSION) && (
                    <div className="mt-4 flex items-center space-x-2 flex-wrap gap-2">
                        {isNudgeReady && (
                            <button 
                                onClick={handleNudgeClick}
                                className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition shadow-sm">
                                <SendIcon className="h-5 w-5 mr-2" />
                                Nudge
                            </button>
                        )}
                        {lead.status === LeadStatus.QUOTE_SENT && (
                            <button onClick={() => onMarkResponded(lead.id)} className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition shadow-sm">
                               <CheckCircleIcon className="h-5 w-5 mr-2" /> Mark Responded
                            </button>
                        )}
                         {lead.status === LeadStatus.IN_DISCUSSION && (
                            <button onClick={() => onMarkWon(lead.id)} className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition shadow-sm">
                               <TrophyIcon className="h-5 w-5 mr-2" /> Mark as Won
                            </button>
                        )}
                         <button onClick={() => setIsLostModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-sm">
                           <XCircleIcon className="h-5 w-5 mr-2" /> Mark as Lost
                        </button>
                         <div className="flex-grow"></div>
                         <button onClick={() => onDelete(lead.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition ml-auto sm:ml-0">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default LeadCard;