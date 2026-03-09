import React from 'react';

interface ArchiveConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const ArchiveConfirmModal: React.FC<ArchiveConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
            <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-lg m-4 shadow-xl">
                <h2 className="text-xl font-bold text-slate-800">Archive Current Month's Leads?</h2>
                <div className="text-sm text-slate-600 mt-2 space-y-2">
                    <p>This action will finalize the current period. Here's what will happen:</p>
                    <ul className="list-disc list-inside bg-slate-50 p-3 rounded-md border border-slate-200">
                        <li>All <span className="font-semibold">Won</span> and <span className="font-semibold">Lost</span> leads will be moved into a permanent monthly archive.</li>
                        <li><span className="font-semibold">Active leads</span> (Quote Sent, In Discussion) will remain in your pipeline to be worked on.</li>
                        <li>You can view all archived data in the "History" tab.</li>
                    </ul>
                    <p className="font-semibold text-red-600">This action cannot be undone.</p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition"
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