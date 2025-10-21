import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();

    return (
        <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
            <div className="w-full px-4">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-semibold">DreamLink Forms</span>
                        </div>
                        <div className="ml-6 flex space-x-4">
                            <Link
                                to="/"
                                className={`inline-flex items-center px-4 py-2 border-b-2 ${
                                    location.pathname === '/'
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                Create Form
                            </Link>
                            <Link
                                to="/forms"
                                className={`inline-flex items-center px-4 py-2 border-b-2 ${
                                    location.pathname === '/forms'
                                        ? 'border-blue-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                View Forms
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
