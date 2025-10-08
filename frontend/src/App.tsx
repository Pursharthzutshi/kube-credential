import { useState } from 'react'
import './index.css'
import './App.css'

import IssuePage from './pages/IssuancePage';
import VerifyPage from './pages/VerificationPage';

export default function App() {
  const [page, setPage] = useState<'issue'|'verify'>('issue');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => setPage('issue')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              page === 'issue' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            Issue Credential
          </button>
          <button 
            onClick={() => setPage('verify')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              page === 'verify' 
                ? 'bg-green-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            Verify Credential
          </button>
        </div>
      </nav>

      {page === 'issue' ? <IssuePage /> : <VerifyPage />}
    </div>
  );
}
