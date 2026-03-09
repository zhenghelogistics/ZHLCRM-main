import React, { useState, useMemo } from 'react';
import { ParsedQuote } from '../utils/emailParser';
import { AlertTriangleIcon, CheckCircleIcon, LoaderIcon } from './Icons';

interface CustomerConfirmationProps {
    parsedData: ParsedQuote;
    existingCustomers: string[];
    onSaveLead: (customerName: string, customerEmail?: string) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="bg-slate-700/50 p-2 rounded-md">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-sm font-medium text-slate-200">{value}</p>
        </div>
    );
};

const CustomerConfirmation: React.FC<CustomerConfirmationProps> = ({ parsedData, existingCustomers, onSaveLead, onCancel, isSaving }) => {
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSave = () => {
        if (!customerName.trim()) {
            setValidationError('Please confirm the customer before saving.');
            return;
        }
        setValidationError(null);
        onSaveLead(customerName.trim(), customerEmail.trim());
    };
    
    const containerRates = useMemo(() => {
        const rates = parsedData.container_rates;
        if (!rates || Object.keys(rates).length === 0) return null;
        return Object.entries(rates).map(([key, value]) => `${key}: USD ${value}`).join(', ');
    }, [parsedData.container_rates]);

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-blue-800/50 rounded-xl p-6 mt-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
                 <h2 className="text-lg font-semibold text-slate-200 flex items-center">
                    <CheckCircleIcon className="h-6 w-6 mr-3 text-green-400"/>
                    Quote Details Parsed
                </h2>
                <button onClick={onCancel} className="text-sm text-slate-400 hover:text-white">&times; Cancel</button>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg">
                 <p className="text-xs text-slate-400">Total Price Identified</p>
                 <p className="text-2xl font-bold text-blue-400">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parsedData.total_price)}
                </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <DetailItem label="Mode" value={parsedData.mode} />
                <DetailItem label="Liner" value={parsedData.liner} />
                <DetailItem label="Industry" value={parsedData.industry} />
                <DetailItem label="Contract Ref" value={parsedData.contract_ref} />
                <DetailItem label="Free Days" value={parsedData.free_days} />
                <DetailItem label="Container Rates" value={containerRates} />
            </div>

            <div className="!mt-6 space-y-4">
                <div>
                    <label htmlFor="customer-name" className="block text-sm font-bold text-slate-100 mb-1">
                        Who is this quote for? (Required)
                    </label>
                    <p className="text-xs text-slate-400 mb-2">Please confirm the customer for this quote.</p>
                    <input
                        type="text"
                        id="customer-name-input"
                        list="customer-list"
                        value={customerName}
                        onChange={(e) => {
                            setCustomerName(e.target.value);
                            if (validationError) setValidationError(null);
                        }}
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Type or select an existing customer..."
                        autoFocus
                    />
                    <datalist id="customer-list">
                        {existingCustomers.map(name => <option key={name} value={name} />)}
                    </datalist>

                    {validationError && (
                        <p className="text-red-400 text-sm mt-2 flex items-center">
                            <AlertTriangleIcon className="h-4 w-4 mr-2" />
                            {validationError}
                        </p>
                    )}
                </div>
                 <div>
                    <label htmlFor="customer-email" className="block text-sm font-medium text-slate-300 mb-1">
                        Customer Email (Optional)
                    </label>
                    <input
                        type="email"
                        id="customer-email-input"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., contact@company.com"
                    />
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center bg-green-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition !mt-6"
            >
                {isSaving ? (
                     <>
                        <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                        Saving Lead...
                    </>
                ) : "Confirm & Save Lead"}
            </button>
        </div>
    );
};

export default CustomerConfirmation;
