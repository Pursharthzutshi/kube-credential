import { useState } from 'react';
import type { AxiosError } from 'axios';
import { verifyCredential } from '../api';
import type { VerificationResult, VerificationResponse, ApiResponse } from '../types';

export default function VerifyPage() {
  const [id, setId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('Frontend: calling verifyCredential with id=', id);

      // Expect a typed API response
      const res = (await verifyCredential({ id })) as ApiResponse<VerificationResponse>;
      console.log('Frontend: verifyCredential returned', res);

      if (res.ok && res.data) {
        setResult(res.data);
      } else if (res.error) {
        setError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      } else {
        setError('Unexpected API response format');
      }
    } catch (e: unknown) {
      const axiosErr = e as AxiosError<{ error?: string }>;
      const message =
        axiosErr?.response?.data?.error ||
        axiosErr?.message ||
        (e instanceof Error ? e.message : String(e));
      console.error('Unhandled verify error', e);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          Verify Credential
        </h1>

        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-1">Credential ID:</label>
          <input
            type="text"
            value={id}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="cred-2025-06"
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || !id}
          className={`w-full py-2 rounded-lg text-white font-semibold transition-all ${
            loading || !id
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Verifying...' : 'Verify'}
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

            <div className="space-y-2">
              <p className="text-gray-800">
                <strong>Valid:</strong>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    result.valid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {String(result.valid)}
                </span>
              </p>
              {result.workerId && (
                <p className="text-gray-800">
                  <strong>Verified by:</strong> {result.workerId}
                </p>
              )}
              {result.issuedAt && (
                <p className="text-gray-800">
                  <strong>Issued At:</strong> {result.issuedAt}
                </p>
              )}
              {result.credential && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Credential:</h4>
                  <pre className="text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border">
                    {JSON.stringify(result.credential, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
