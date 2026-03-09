
import React from 'react';
import { BarChart2Icon, LayoutDashboardIcon, HistoryIcon, ShipIcon, CodeIcon } from './Icons';
import { Page } from '../App';

interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

const NavButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
     <button 
        onClick={onClick}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-slate-300 hover:bg-zinc-700/50'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        {label}
    </button>
);

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
    return (
        <header className="bg-zinc-900/40 backdrop-blur-md border-b border-zinc-800/50 sticky top-0 z-20">
            <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold text-slate-100">Zhenghe Logistics CRM</h1>
                </div>
                <nav className="flex items-center space-x-1 bg-zinc-800/50 p-1 rounded-lg">
                   <NavButton 
                        label="Pipeline"
                        icon={<LayoutDashboardIcon className="h-5 w-5 mr-2"/>}
                        isActive={currentPage === 'pipeline'}
                        onClick={() => setCurrentPage('pipeline')}
                   />
                   <NavButton 
                        label="Reporting"
                        icon={<BarChart2Icon className="h-5 w-5 mr-2"/>}
                        isActive={currentPage === 'reporting'}
                        onClick={() => setCurrentPage('reporting')}
                   />
                   <NavButton 
                        label="History"
                        icon={<HistoryIcon className="h-5 w-5 mr-2"/>}
                        isActive={currentPage === 'history'}
                        onClick={() => setCurrentPage('history')}
                   />
                    <NavButton 
                        label="Dev Tools"
                        icon={<CodeIcon className="h-5 w-5 mr-2"/>}
                        isActive={currentPage === 'devtools'}
                        onClick={() => setCurrentPage('devtools')}
                   />
                </nav>
            </div>
        </header>
    );
};

export default Header;