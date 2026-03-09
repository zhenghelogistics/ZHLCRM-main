import React, { useEffect } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, XIcon } from './Icons';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-close after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const isSuccess = type === 'success';

    const containerClasses = `
        fixed top-8 right-8 z-50 flex items-center w-full max-w-xs p-4 text-slate-700 bg-white backdrop-blur-md rounded-xl shadow-lg border
        ${isSuccess ? 'border-green-200' : 'border-red-200'}
    `;

    const iconClasses = `
        inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg
        ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
    `;

    return (
        <div id="toast-notification" className={containerClasses} role="alert">
            <div className={iconClasses}>
                {isSuccess ? <CheckCircleIcon className="w-5 h-5" /> : <AlertTriangleIcon className="w-5 h-5" />}
                <span className="sr-only">{isSuccess ? 'Check' : 'Warning'} icon</span>
            </div>
            <div className="ml-3 text-sm font-normal">{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 inline-flex h-8 w-8"
                aria-label="Close"
                onClick={onClose}
            >
                <span className="sr-only">Close</span>
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default Toast;