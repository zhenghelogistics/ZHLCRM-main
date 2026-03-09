import React from 'react';

const BackgroundWaves: React.FC = () => (
    <div className="fixed bottom-0 left-0 w-full h-1/2 pointer-events-none z-0 opacity-20" aria-hidden="true">
        <svg
            className="w-full h-full"
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
        >
            <defs>
                <path
                    id="wave-path-1"
                    d="M0,160L48,181.3C96,203,192,245,288,250.7C384,256,480,224,576,192C672,160,768,128,864,133.3C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                />
                 <path
                    id="wave-path-2"
                    d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,240C840,256,960,256,1080,234.7C1200,213,1320,171,1380,149.3L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                />
            </defs>
            <use href="#wave-path-1" x="0" y="0" fill="#3b82f6" />
            <use href="#wave-path-2" x="0" y="30" fill="#2563eb" />
        </svg>
    </div>
);

export default BackgroundWaves;