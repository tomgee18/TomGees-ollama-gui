/** @type {import('next').NextConfig} */
<<<<<<< HEAD
const nextConfig = {};

export default nextConfig;
=======
const nextConfig = {
  env: {
    // Make Ollama URL configurable via environment variable
    NEXT_PUBLIC_OLLAMA_URL: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434',
  },
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['react-markdown', 'react-syntax-highlighter']
  }
};

export default nextConfig;
>>>>>>> c8190b3c63acf8071f24c721d2b9b9c3259d6e27
