import { useState } from 'react'
import './index.css'
import './App.css'

import IssuePage from './pages/IssuancePage';
import VerifyPage from './pages/VerificationPage';

export default function App() {
  const [page, setPage] = useState<'issue'|'verify'>('issue');
  return (
    <div>
      <nav style={{ padding: 12 }}>
        <button style={{ padding: 12 }} onClick={() => setPage('issue')}>Issue</button>
        <button style={{ marginLeft: 8 }}  onClick={() => setPage('verify')} >Verify</button>
      </nav>
      {page === 'issue' ? <IssuePage /> : <VerifyPage />}
    </div>
  );
}