import React, { useState } from 'react';
import { MailIcon, LoaderIcon, ArrowRightIcon } from './Icons';

interface EmailInputProps {
    onParseDetails: (emailText: string) => void;
    isLoading: boolean;
}

const EmailInput: React.FC<EmailInputProps> = ({ onParseDetails, isLoading }) => {
    const [emailText, setEmailText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onParseDetails(emailText);
        // Do not clear email text, user might want to see it while confirming
    };

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-xl p-6">
             <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                <MailIcon className="h-6 w-6 mr-3 text-slate-400"/>
                Process a Sent Quote
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email-content" className="block text-sm font-medium text-slate-300 mb-1">
                        Paste Quote Email Body Below
                    </label>
                    <textarea
                        id="email-content"
                        rows={10}
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm text-slate-200 placeholder:text-slate-500"
                        placeholder="Paste the full body content of the email you sent to the client here..."
                        value={emailText}
                        onChange={(e) => setEmailText(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    disabled={isLoading || !emailText}
                >
                    {isLoading ? (
                        <>
                            <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            Parsing...
                        </>
                    ) : (
                         <>
                            Parse Quote Details
                            <ArrowRightIcon className="ml-2 h-5 w-5"/>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default EmailInput;
