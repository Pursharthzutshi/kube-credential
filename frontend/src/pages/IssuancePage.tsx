import { useState } from 'react';
import { issueCredential } from '../../api.ts';
import type { IssuanceResult } from '../types';

export default function IssuePage() {
  const [id, setId] = useState('');
  const [holder, setHolder] = useState('');
  const [subject, setSubject] = useState('{}');
  const [result, setResult] = useState<IssuanceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleIssue = async () => {
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        id,
        subject: {
          holder: holder || 'Unknown Holder',
          ...JSON.parse(subject || '{}'),
        },
      };
      const data = await issueCredential(payload);
      setResult(data);
    } catch (err) {
      const error = err as Error;
      setResult({ error: error?.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          Issue Credential
        </h1>

        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-1">ID:</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="cred-2025-06"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-1">Holder:</label>
          <input
            type="text"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-1">
            Extra JSON fields:
          </label>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            rows={5}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder='{"email": "john@example.com", "department": "Design"}'
          />
        </div>

        <button
          onClick={handleIssue}
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
            loading
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Issuing' : 'Issue'}
        </button>

        {result && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-auto">
            <h3 className="font-semibold text-gray-700 mb-2">Response:</h3>
            <pre className="text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
