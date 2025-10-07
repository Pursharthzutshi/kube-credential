// import axios from 'axios';

// // Detect environment variables depending on the build tool
// const ISSUANCE_BASE =
//   process.env.REACT_APP_ISSUANCE_URL || 'http://localhost:4001';
// const VERIFY_BASE =
//   process.env.REACT_APP_VERIFY_URL || 'http://localhost:4002';

// export async function issueCredential(payload: any) {
//   const { data } = await axios.post(`${ISSUANCE_BASE}/issue`, payload);
//   return data;
// }

// export async function verifyCredential(payload: any) {
//   const { data } = await axios.post(`${VERIFY_BASE}/verify`, payload);
//   return data;
// }


import axios from 'axios';

// For Vite use import.meta.env, for CRA use process.env, for Next.js use process.env.NEXT_PUBLIC_...
const ISSUANCE_BASE = import.meta.env.VITE_ISSUANCE_URL || 'http://localhost:4001';
const VERIFY_BASE = import.meta.env.VITE_VERIFY_URL || 'http://localhost:4002';

const axiosInstance = axios.create({
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

export async function issueCredential(payload: any) {
  try {
    const { data } = await axiosInstance.post(`${ISSUANCE_BASE}/issue`, payload);
    return { ok: true, data };
  } catch (err: any) {
    // Normalize error for frontend
    console.error('issueCredential error', err?.response?.status, err?.message, err?.response?.data);
    return {
      ok: false,
      status: err?.response?.status || null,
      error: err?.response?.data || err?.message || 'unknown error'
    };
  }
}

export async function verifyCredential(payload: any) {
  try {
    const { data } = await axiosInstance.post(`${VERIFY_BASE}/verify`, payload);
    return { ok: true, data };
  } catch (err: any) {
    console.error('verifyCredential error', err?.response?.status, err?.message, err?.response?.data);
    return {
      ok: false,
      status: err?.response?.status || null,
      error: err?.response?.data || err?.message || 'unknown error'
    };
  }
}
