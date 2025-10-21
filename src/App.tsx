import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import CreateForm from './pages/CreateForm';
import EditForm from './pages/EditForm';
import FormList from './pages/FormList';
import FormPreview from './pages/FormPreview';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="pt-18">
                    <Routes>
                        <Route path="/" element={<CreateForm />} />
                        <Route path="/forms" element={<FormList />} />
                        <Route path="/forms/:id" element={<FormPreview />} />
                        <Route path="/forms/:id/edit" element={<EditForm />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
