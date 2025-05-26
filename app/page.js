"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./chat.module.css";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

const INITIAL_SYSTEM_MESSAGE = { role: "system", content: "Hello! I'm Neo, your AI coding assistant. Ask me anything about programming!" };

export default function Chat() {
  const [messages, setMessages] = useState([INITIAL_SYSTEM_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(50);
  const [topP, setTopP] = useState(0.9);
  const [theme, setTheme] = useState('light'); // Default, will be updated by useEffect
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Focus input field on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem('chatHistory');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      }
    } catch (error) {
      console.error("Error loading chat history from localStorage:", error);
      // If error, messages will retain their default initial value
    }
  }, []);

  // Initialize Theme on Mount (from README)
  useEffect(() => {
    const savedTheme = localStorage.getItem('themePreference');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
    // Default to 'light' is already handled by useState initial value
  }, []);

  // Apply Theme and Persist on Change (from README)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('themePreference', theme);
    } catch (error) {
      console.error("Failed to save theme preference to localStorage:", error);
    }
  }, [theme]);

  // Fetch available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("http://localhost:11434/api/tags");
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          setModels(data.models);
          // Set default model if available
          if (data.models.length > 0) {
            setSelectedModel(data.models[0].name);
          }
        }
      } catch (error) {
        console.error("Error fetching models:", error);
      }
    };
    
    fetchModels();
  }, []);

  const handleClearHistory = () => {
    setMessages([INITIAL_SYSTEM_MESSAGE]);
    try {
      localStorage.removeItem('chatHistory');
    } catch (error) {
      console.error("Failed to remove chat history from localStorage:", error);
    }
  };

  // Add Theme Toggle Handler Function (from README)
  const handleToggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const sendMessage = async () => {
    if (!input) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    try {
      localStorage.setItem('chatHistory', JSON.stringify(newMessages));
    } catch (error) {
      console.error("Failed to save chat history after user message:", error);
    }
    setInput("");
    setIsLoading(true);

    const history = newMessages.map(m => `${m.role}: ${m.content}`).join("\n");
    console.log("History:", history);
  
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        model: selectedModel, 
        prompt: history, 
        stream: true,
        options: {
          temperature: temperature,
          top_k: topK,
          top_p: topP,
        }
      }),
    });
  
    // Read the stream line by line
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiMessage = "";
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter(Boolean); // Remove empty lines
  
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.response) {
            aiMessage += json.response; // Append streaming response
            const updatedMessages = [...newMessages, { role: "ai", content: aiMessage }];
            setMessages(updatedMessages);
            try {
              localStorage.setItem('chatHistory', JSON.stringify(updatedMessages));
            } catch (error) {
              console.error("Failed to save chat history during AI response streaming:", error);
            }
          }
        } catch (e) {
          console.error("JSON parse error:", e, "Raw line:", line);
        }
      }
    }
    
    setIsLoading(false);
  };
  

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.chatContainer} data-theme={theme}> {/* Added data-theme based on instructions for html tag, also good for local scoping */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}> {/* Added this wrapper */}
          Chat with Neo
          <div className={styles.headerControls}>
            {/* Theme Toggle Button (from README) */}
            <button
              onClick={handleToggleTheme}
              className={styles.themeToggleButton}
              title={theme === 'light' ? "Switch to Dark Theme" : "Switch to Light Theme"}
            >
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <div className={styles.modelSelector}>
              <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className={styles.modelDropdown}
              disabled={isLoading || messages.length > 1}
              title={messages.length > 1 ? "Cannot switch models during an active conversation" : "Select a model"}
            >
              <option value="" disabled={models.length > 0}>
                {models.length > 0 ? "Select a model" : "No models installed"}
              </option>
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleClearHistory} 
            className={styles.clearHistoryButton}
            disabled={messages.length <= 1 && messages[0]?.content === INITIAL_SYSTEM_MESSAGE.content}
            title="Clear chat history"
          >
            Clear History
          </button>
          </div>
        </div> {/* End of headerTopRow */}
        <div className={styles.parameterSettings}>
          <div className={styles.parameterControl}>
            <label htmlFor="temperature">Temperature:</label>
            <input
              type="number"
              id="temperature"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              min="0.0"
              max="2.0"
              step="0.1"
              title="Controls randomness. Lower is more deterministic."
              className={styles.parameterInput}
              disabled={isLoading || messages.length > 1}
            />
          </div>
          <div className={styles.parameterControl}>
            <label htmlFor="topK">Top K:</label>
            <input
              type="number"
              id="topK"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              min="1"
              max="100"
              step="1"
              title="Considers only the top K most likely tokens."
              className={styles.parameterInput}
              disabled={isLoading || messages.length > 1}
            />
          </div>
          <div className={styles.parameterControl}>
            <label htmlFor="topP">Top P:</label>
            <input
              type="number"
              id="topP"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              min="0.0"
              max="1.0"
              step="0.05"
              title="Considers tokens with cumulative probability up to P."
              className={styles.parameterInput}
              disabled={isLoading || messages.length > 1}
            />
          </div>
        </div>
      </div>
      
      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${styles.message} ${
              message.role === 'user' 
                ? styles.userMessage 
                : message.role === 'system' 
                  ? styles.systemMessage 
                  : styles.aiMessage
            }`}
          >
            <div className={styles.role}>{message.role}</div>
            <div className={styles.content}>
              {message.role === 'ai' || message.role === 'system' ? (
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className={styles.loading}>
            <span>Neo is thinking</span>
            <div className={styles.loadingDots}>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
              <div className={styles.dot}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          className={styles.inputField}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Neo something..."
          disabled={isLoading}
        />
        <button 
          className={styles.sendButton} 
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// How can I add customizations to it? Like, calling an api on command