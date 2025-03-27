# Ollama GUI

A modern, user-friendly web interface for interacting with locally installed LLM models via Ollama. This project provides an intuitive chat interface that allows you to communicate with various language models running on your local machine.

## Features

- 🚀 Clean, modern chat interface
- 💬 Real-time streaming responses
- 🔄 Dynamic model switching
- 🎨 Markdown and code syntax highlighting
- 📱 Responsive design for all devices

## Prerequisites

1. [Node.js](https://nodejs.org/) (v18 or higher)
2. [Ollama](https://ollama.ai/) - for running LLM models locally

## Setup

1. Install Ollama and download your preferred models:
   
    Install Ollama from https://ollama.ai/ or run the following command:

   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```
   Then pull your desired models, for example:

   ```bash
   ollama pull gemma:3b
   ```

2. Clone and set up the project:
   ```bash
   git clone git@github.com:khokonm/ollama-gui.git
   cd ollama-gui
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Select your preferred model from the dropdown menu in the header
2. Type your message in the input field
3. Press Enter or click the Send button to chat with the model
4. The model's responses will stream in real-time with proper formatting for code and markdown

## Development

This project is built with:
- [Next.js](https://nextjs.org/) - React framework
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering
- [Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) - Code highlighting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
