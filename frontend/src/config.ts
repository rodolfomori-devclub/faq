// API Configuration
export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://backend-production-35eb.up.railway.app/api'
  : 'http://localhost:3001/api';

// Cloudinary Configuration
// Para usar, crie uma conta em https://cloudinary.com
// 1. Vá em Settings > Upload
// 2. Crie um "Upload Preset" com "Unsigned" mode
// 3. Substitua os valores abaixo
export const CLOUDINARY_CLOUD_NAME = 'dam2h47eq'; // Seu cloud name
export const CLOUDINARY_UPLOAD_PRESET = 'faq_uploads'; // Seu upload preset (criar no Cloudinary)
