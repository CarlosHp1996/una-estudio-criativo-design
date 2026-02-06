// Placeholder images for products

export const PRODUCT_PLACEHOLDER =
  "data:image/svg+xml;base64," +
  btoa(`
<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="#f3f4f6"/>
  <g opacity="0.5">
    <path d="M150 100C127.909 100 110 117.909 110 140V160C110 182.091 127.909 200 150 200C172.091 200 190 182.091 190 160V140C190 117.909 172.091 100 150 100Z" fill="#9ca3af"/>
    <circle cx="135" cy="140" r="8" fill="#6b7280"/>
    <circle cx="165" cy="140" r="8" fill="#6b7280"/>
    <path d="M135 170C135 170 142.5 177.5 150 177.5C157.5 177.5 165 170 165 170" stroke="#6b7280" stroke-width="3" stroke-linecap="round"/>
  </g>
  <text x="150" y="240" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">Sem Imagem</text>
</svg>
`);

export const LOADING_PLACEHOLDER =
  "data:image/svg+xml;base64," +
  btoa(`
<svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f3f4f6"/>
      <stop offset="50%" stop-color="#e5e7eb"/>
      <stop offset="100%" stop-color="#f3f4f6"/>
      <animate attributeName="x1" values="0%;100%;0%" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="x2" values="100%;200%;100%" dur="2s" repeatCount="indefinite"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" fill="url(#gradient)"/>
</svg>
`);
