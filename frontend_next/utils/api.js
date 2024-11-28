// // utils/api.js

// export const scanFile = async (file) => {
//     // Validate file size
//     if (file.size > 32 * 1024 * 1024) {
//         throw new Error('File size must be less than 32MB');
//     }

//     // Validate file type
//     const allowedTypes = ['application/x-msdownload', 'application/pdf', 'application/x-executable'];
//     if (!allowedTypes.includes(file.type)) {
//         throw new Error('Invalid file type. Only EXE, DLL, and PDF files are allowed.');
//     }

//     const formData = new FormData();
//     formData.append('file', file, file.name);

//     try {
//         const response = await fetch('/api/classify', {
//             method: 'POST',
//             body: formData,
//         });

//         if (!response.ok) {
//             const error = await response.json();
//             throw new Error(error.error || 'Scan failed');
//         }

//         const result = await response.json();
        
//         return {
//             filename: file.name,
//             fileSize: formatFileSize(file.size),
//             fileType: file.type,
//             malicious: result.malicious || 0,
//             harmless: result.harmless || 0,
//             suspicious: result.suspicious || 0,
//             undetected: result.undetected || 0,
//             classification: result.classification || { type: 'Unknown', confidence: 0 },
//             behaviors: result.behaviors || [],
//             riskLevel: calculateRiskLevel(result),
//             timestamp: new Date().toISOString(),
//             sha256: result.sha256 || '',
//             detectionRatio: calculateDetectionRatio(result),
//         };
//     } catch (error) {
//         console.error('Scan error:', error);
//         throw error;
//     }
// };

// const calculateRiskLevel = (result) => {
//     const total = result.malicious + result.harmless + result.suspicious + result.undetected;
//     if (total === 0) return 'Unknown';
    
//     const maliciousRatio = result.malicious / total;
//     const suspiciousRatio = result.suspicious / total;
    
//     if (maliciousRatio >= 0.3) return 'Critical';
//     if (maliciousRatio >= 0.1 || suspiciousRatio >= 0.3) return 'High';
//     if (maliciousRatio > 0 || suspiciousRatio >= 0.1) return 'Medium';
//     return 'Low';
// };

// const calculateDetectionRatio = (result) => {
//     const detected = result.malicious + result.suspicious;
//     const total = result.malicious + result.harmless + result.suspicious + result.undetected;
//     return total > 0 ? (detected / total) * 100 : 0;
// };

// const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// };