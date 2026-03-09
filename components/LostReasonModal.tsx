
import React, { useState, useEffect } from 'react';

interface LostReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

const LostReasonModal: React.FC<LostReasonModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setReason(''); // Reset reason when modal opens
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (reason.trim()) {
            onSubmit(reason.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-6 w-full max-w-md m-4">
                <h2 className="text-lg font-bold text-slate-100">Reason for Loss</h2>
                <p className="text-sm text-slate-400 mt-1">Please provide a reason why this lead was lost. This is required.</p>
                
                <div className="mt-4">
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Price too high, went with a competitor..."
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition text-slate-200 placeholder:text-slate-500"
                        rows={4}
                        autoFocus
                    />
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-md transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!reason.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition disabled:bg-red-600/50 disabled:cursor-not-allowed"
                    >
                        Confirm Loss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LostReasonModal;
