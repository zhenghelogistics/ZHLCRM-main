
import React from 'react';

interface ArchiveConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const ArchiveConfirmModal: React.FC<ArchiveConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-6 w-full max-w-lg m-4">
                <h2 className="text-xl font-bold text-slate-100">Archive Current Month's Leads?</h2>
                <div className="text-sm text-slate-300 mt-2 space-y-2">
                    <p>This action will finalize the current period. Here's what will happen:</p>
                    <ul className="list-disc list-inside bg-slate-700/50 p-3 rounded-md border border-slate-600">
                        <li>All <span className="font-semibold">Won</span> and <span className="font-semibold">Lost</span> leads will be moved into a permanent monthly archive.</li>
                        <li><span className="font-semibold">Active leads</span> (Quote Sent, In Discussion) will remain in your pipeline to be worked on.</li>
                        <li>You can view all archived data in the "History" tab.</li>
                    </ul>
                    <p className="font-semibold text-red-400">This action cannot be undone.</p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-md transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
                    >
                        Yes, Archive Month
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchiveConfirmModal;
