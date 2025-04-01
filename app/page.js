"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./chat.module.css";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function Chat() {
  const [messages, setMessages] = useState([{ role: "system", content: "Hello! I'm Neo, your AI coding assistant. Ask me anything about programming!" }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
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
  const sendMessage = async () => {
    if (!input) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const history = newMessages.map(m => `${m.role}: ${m.content}`).join("\n");
    console.log("History:", history);
  
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: selectedModel, prompt: history, stream: true }),
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
            setMessages([...newMessages, { role: "ai", content: aiMessage }]);
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
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        Chat with Neo
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