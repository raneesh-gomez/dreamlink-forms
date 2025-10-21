import { BrowserRouter, Route, Routes } from 'react-router-dom';

import SurveyCreatorWidget from './components/forms/surveyjs/SurveyCreator';
import Navbar from './components/layout/Navbar';
import EditSurvey from './pages/EditSurvey';
import SurveyList from './pages/SurveyList';
import SurveyPreview from './pages/SurveyPreview';

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="pt-18">
                    <Routes>
                        <Route path="/" element={<SurveyCreatorWidget />} />
                        <Route path="/forms" element={<SurveyList />} />
                        <Route path="/forms/:id" element={<SurveyPreview />} />
                        <Route path="/forms/:id/edit" element={<EditSurvey />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
