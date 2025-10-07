import { useState } from 'react';
import { verifyCredential } from '../../api.ts';

export default function VerifyPage() {
  const [id, setId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('Frontend: calling verifyCredential with id=', id);
      const res = await verifyCredential({ id });
      console.log('Frontend: verifyCredential returned', res);

      if (res && res.ok) {
        setResult(res.data);
      } else if (res && res.error) {
        setError(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      } else {
        setResult(res);
      }
    } catch (e: any) {
      console.error('Unhandled verify error', e);
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Verify Credential</h1>

      <div style={{ marginBottom: 10 }}>
        <label>
          Credential ID:
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            style={{ marginLeft: 10 }}
          />
        </label>
      </div>

      <button onClick={handleVerify} disabled={loading || !id}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>

      {error && (
        <div style={{ marginTop: 20, color: 'red' }}>
          <h3>Error</h3>
          <pre>{error}</pre>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Result</h3>

          {result.valid !== undefined ? (
            <div>
              <p>
                <strong>Valid:</strong> {String(result.valid)}
              </p>
              {result.verifiedBy && (
                <p>
                  <strong>Verified by:</strong> {result.verifiedBy}
                </p>
              )}
              {result.timestamp && (
                <p>
                  <strong>Timestamp:</strong> {result.timestamp}
                </p>
              )}
              {result.credential && (
                <>
                  <h4>Credential</h4>
                  <pre>{JSON.stringify(result.credential, null, 2)}</pre>
                </>
              )}
            </div>
          ) : (
            <pre>{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
