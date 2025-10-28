import { Link, useLocation } from 'react-router-dom';

import { useFormRepositoryContext } from '@/hooks/context-hooks/use-formrepository-context';
import type { PersistMode } from '@/types/persistence.types';

export default function Navbar() {
    const location = useLocation();
    const { mode, setMode } = useFormRepositoryContext();

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
            <div className="w-full mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Brand + Nav Links */}
                    <div className="flex items-center gap-8">
                        <span className="text-xl font-semibold text-gray-900">DreamLink Forms</span>

                        <div className="flex space-x-4">
                            <Link
                                to="/forms/create"
                                className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    location.pathname === '/forms/create'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                                }`}
                            >
                                Create Form
                            </Link>
                            <Link
                                to="/forms"
                                className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    location.pathname === '/forms'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                                }`}
                            >
                                View Forms
                            </Link>
                        </div>
                    </div>

                    {/* Right: Persistence Mode Selector */}
                    <div className="flex items-center">
                        <label
                            htmlFor="persistence-mode"
                            className="text-sm font-medium text-gray-700 mr-2"
                        >
                            Storage:
                        </label>
                        <select
                            id="persistence-mode"
                            value={mode}
                            onChange={(e) => setMode(e.target.value as PersistMode)}
                            className="border border-gray-300 rounded-md bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm hover:border-gray-400"
                            title="Persistence backend"
                        >
                            <option value="frappe">Frappe</option>
                            <option value="local">Local</option>
                        </select>
                    </div>
                </div>
            </div>
        </nav>
    );
}
