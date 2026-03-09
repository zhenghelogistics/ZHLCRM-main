import React from 'react';
import { CodeIcon } from './Icons';

const DevToolsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Developer Tools</h1>
                <p className="text-slate-500 mt-1">Tools for local development and analysis.</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center">
                    <CodeIcon className="h-6 w-6 mr-3 text-slate-500" />
                    Project Summary Tool
                </h2>
                <p className="text-sm text-slate-500">
                    This developer tool is available in local development mode for project analysis. It is disabled in this production build.
                </p>
            </div>
        </div>
    );
};

export default DevToolsPage;