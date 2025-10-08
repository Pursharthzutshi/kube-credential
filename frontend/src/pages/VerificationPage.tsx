import React, { useState } from 'react';
import { verifyCredential } from '../../api.ts';

export default function VerificationPage() {
  const [id, setId] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('Verifying');

    try {
      const res = await verifyCredential({ id });
      setMsg(JSON.stringify(res, null, 2));
    } catch (err) {
      const error = err as Error & { response?: { data?: { error?: string } } };
      setMsg(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-green-600 mb-6 text-center">
          Verify Credential
        </h1>

        <form onSubmit={onVerify}>
          <div className="mb-4">
            <label className="block font-medium text-gray-700 mb-1">
              Credential ID:
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="cred-2025-06"
            />
          </div>

          {/* Changed button color */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
              loading
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {msg && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-auto">
            <h3 className="font-semibold text-gray-700 mb-2">Result:</h3>
            <pre className="text-gray-800 whitespace-pre-wrap">{msg}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
