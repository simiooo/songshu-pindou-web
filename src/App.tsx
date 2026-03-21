import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EditorPage } from '@/pages/EditorPage';
import { initLLMProviderStore } from '@/store/llmProviderStore';

function App() {
  useEffect(() => {
    // Initialize LLM Provider store from dexie on app startup
    void initLLMProviderStore();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
