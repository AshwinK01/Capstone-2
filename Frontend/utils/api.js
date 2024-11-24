// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// export const login = async (credentials) => {
//   const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     credentials: 'include',
//     body: JSON.stringify(credentials),
//   });

//   if (!response.ok) {
//     throw new Error('Login failed');
//   }

//   return response.json();
// };

// export const scanFile = async (file) => {
//   const formData = new FormData();
//   formData.append('file', file); // Ensure file is appended as-is

//   const response = await fetch(`${API_BASE_URL}/api/classify`, {
//     method: 'POST',
//     body: formData,
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.error || 'Scan failed');
//   }

//   const result = await response.json();
//   return {
//     filename: file.name,
//     malicious: result.malicious || 0,
//     harmless: result.harmless || 0,
//     suspicious: result.suspicious || 0,
//     undetected: result.undetected || 0,
//     riskLevel: calculateRiskLevel(result),
//     timestamp: new Date().toISOString(),
//   };
// };


// const calculateRiskLevel = (result) => {
//   const total = result.malicious + result.harmless + result.suspicious + result.undetected;
//   const maliciousRatio = result.malicious / total;
//   const suspiciousRatio = result.suspicious / total;

//   if (maliciousRatio >= 0.3) return 'Critical';
//   if (maliciousRatio >= 0.1 || suspiciousRatio >= 0.3) return 'High';
//   if (maliciousRatio > 0 || suspiciousRatio >= 0.1) return 'Medium';
//   return 'Low';
// };