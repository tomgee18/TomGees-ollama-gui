/** @type {import('next').NextConfig} */
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