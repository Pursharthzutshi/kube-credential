import { useState } from 'react';
import { verifyCredential } from '../../api';
import type { VerificationResultState } from '../types';

export default function VerifyPage() {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResultState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await verifyCredential({ id });
      if (res && res.ok) setResult(res.data);
      else if (res && res.error) setError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      else setResult(res);
    } catch (e) {
      const error = e as Error;
      setError(error?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-green-600 mb-6 text-center">
          Verify Credential
        </h1>

        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-1">Credential ID:</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="cred-2025-06"
          />
        </div>

        <button 
          onClick={handleVerify} 
          disabled={loading || !id}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
            loading || !id
              ? 'bg-green-300 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? 'Verifying' : 'Verify'}
        </button>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
            <h3 className="font-semibold text-red-700 mb-2">Error:</h3>
            <pre className="text-red-800 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-auto">
            <h3 className="font-semibold text-gray-700 mb-2">Result:</h3>
            <pre className="text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
