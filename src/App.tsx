import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import Navbar from './components/layout/Navbar';
import { useFrappeProbe } from './hooks/use-frappe-probe';
import CreateForm from './pages/CreateForm';
import EditForm from './pages/EditForm';
import FormList from './pages/FormList';
import FormPreview from './pages/FormPreview';
import FormResponses from './pages/FormResponses';

function App() {
    useFrappeProbe({
        enabled: true,
        withToasts: true,
        limit: 10,
    });

    return (
        <HashRouter>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="pt-18">
                    <Toaster richColors position="top-right" />
                    <Routes>
                        <Route path="/" element={<Navigate to="/forms/create" replace />} />
                        <Route path="/forms/create" element={<CreateForm />} />
                        <Route path="/forms" element={<FormList />} />
                        <Route path="/forms/:frappeName" element={<FormPreview />} />
                        <Route path="/forms/:frappeName/edit" element={<EditForm />} />
                        <Route path="/forms/:frappeName/responses" element={<FormResponses />} />
                        <Route path="*" element={<Navigate to="/forms/create" replace />} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
}

export default App;
