"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./chat.module.css";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

const INITIAL_SYSTEM_MESSAGE = { role: "system", content: "Hello! I'm TomAssist. How can I help you today?" };

// Get configurable Ollama API URL from environment or use default
const OLLAMA_BASE_URL = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";

// Utility functions for chat management
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateSessionTitle = (messages) => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return "New Chat";
  const title = firstUserMessage.content.trim().slice(0, 50);
  return title.length < firstUserMessage.content.trim().length ? title + "..." : title;
};

const exportToJSON = (sessions, activeSessionId) => {
  const exportData = {
    exportDate: new Date().toISOString(),
    activeSessionId,
    sessions: sessions
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ollama-chat-history-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToMarkdown = (sessions) => {
  let markdown = `# Ollama Chat History Export\n\nExported on: ${new Date().toLocaleDateString()}\n\n`;
  
  sessions.forEach(session => {
    markdown += `## ${session.title}\n\n`;
    markdown += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n`;
    markdown += `**Last Modified:** ${new Date(session.lastModified).toLocaleString()}\n`;
    if (session.bookmarked) markdown += `**Bookmarked:** ⭐\n`;
    markdown += `\n---\n\n`;
    
    session.messages.forEach(message => {
      if (message.role !== 'system') {
        markdown += `### ${message.role.toUpperCase()}\n\n`;
        markdown += `${message.content}\n\n`;
      }
    });
    markdown += `\n---\n\n`;
  });
  
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ollama-chat-history-${new Date().toISOString().split('T')[0]}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function Chat() {
  // Session management state
  const [sessions, setSessions] = useState({});
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Current session state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(50);
  const [topP, setTopP] = useState(0.9);
  const [theme, setTheme] = useState('light');
  const [modelsLoading, setModelsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const draftTimeoutRef = useRef(null);
  
  // Get current session messages
  const currentMessages = activeSessionId && sessions[activeSessionId] 
    ? sessions[activeSessionId].messages 
    : [INITIAL_SYSTEM_MESSAGE];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);
  
  // Focus input field on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeSessionId]);

  // Load sessions from localStorage on component mount
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem('chatSessions');
      const storedActiveId = localStorage.getItem('activeSessionId');
      
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions);
        setSessions(parsedSessions);
        
        if (storedActiveId && parsedSessions[storedActiveId]) {
          setActiveSessionId(storedActiveId);
        } else {
          // Create a new session if none exists
          createNewSession();
        }
      } else {
        // Create initial session
        createNewSession();
      }
    } catch (error) {
      console.error("Error loading chat sessions from localStorage:", error);
      createNewSession();
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(sessions).length > 0) {
      try {
        localStorage.setItem('chatSessions', JSON.stringify(sessions));
      } catch (error) {
        console.error("Failed to save sessions to localStorage:", error);
      }
    }
  }, [sessions]);

  // Save active session ID
  useEffect(() => {
    if (activeSessionId) {
      try {
        localStorage.setItem('activeSessionId', activeSessionId);
      } catch (error) {
        console.error("Failed to save active session ID:", error);
      }
    }
  }, [activeSessionId]);

  // Auto-save draft as user types
  useEffect(() => {
    if (activeSessionId && input) {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
      
      draftTimeoutRef.current = setTimeout(() => {
        setSessions(prev => ({
          ...prev,
          [activeSessionId]: {
            ...prev[activeSessionId],
            draft: input
          }
        }));
      }, 1000); // Save draft after 1 second of inactivity
    }
    
    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
    };
  }, [input, activeSessionId]);

  // Load draft when switching sessions
  useEffect(() => {
    if (activeSessionId && sessions[activeSessionId]?.draft) {
      setInput(sessions[activeSessionId].draft);
    } else {
      setInput("");
    }
  }, [activeSessionId]);

  // Initialize Theme on Mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('themePreference');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Apply Theme and Persist on Change
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
      setModelsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          setModels(data.models);
          if (data.models.length > 0) {
            setSelectedModel(data.models[0].name);
          }
        } else {
          throw new Error("Invalid response format from Ollama API");
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        setError("Failed to connect to Ollama. Please ensure Ollama is running and accessible at " + OLLAMA_BASE_URL);
      } finally {
        setModelsLoading(false);
      }
    };
    
    fetchModels();
  }, []);

  // Session management functions
  const createNewSession = () => {
    const newSessionId = generateSessionId();
    const newSession = {
      id: newSessionId,
      title: "New Chat",
      messages: [INITIAL_SYSTEM_MESSAGE],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      bookmarked: false,
      draft: ""
    };
    
    setSessions(prev => ({ ...prev, [newSessionId]: newSession }));
    setActiveSessionId(newSessionId);
    setInput("");
  };

  const deleteSession = (sessionId) => {
    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[sessionId];
      return newSessions;
    });
    
    if (activeSessionId === sessionId) {
      const remainingSessions = Object.keys(sessions).filter(id => id !== sessionId);
      if (remainingSessions.length > 0) {
        setActiveSessionId(remainingSessions[0]);
      } else {
        createNewSession();
      }
    }
  };

  const duplicateSession = (sessionId) => {
    const sessionToDuplicate = sessions[sessionId];
    if (!sessionToDuplicate) return;
    
    const newSessionId = generateSessionId();
    const duplicatedSession = {
      ...sessionToDuplicate,
      id: newSessionId,
      title: `${sessionToDuplicate.title} (Copy)`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      draft: ""
    };
    
    setSessions(prev => ({ ...prev, [newSessionId]: duplicatedSession }));
    setActiveSessionId(newSessionId);
  };

  const toggleBookmark = (sessionId) => {
    setSessions(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        bookmarked: !prev[sessionId].bookmarked,
        lastModified: new Date().toISOString()
      }
    }));
  };

  const updateSessionTitle = (sessionId, newTitle) => {
    setSessions(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        title: newTitle,
        lastModified: new Date().toISOString()
      }
    }));
  };

  const handleClearHistory = () => {
    if (activeSessionId) {
      setSessions(prev => ({
        ...prev,
        [activeSessionId]: {
          ...prev[activeSessionId],
          messages: [INITIAL_SYSTEM_MESSAGE],
          lastModified: new Date().toISOString(),
          draft: ""
        }
      }));
      setInput("");
    }
  };

  const handleToggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedModel || !activeSessionId) return;
    
    const currentSession = sessions[activeSessionId];
    const newMessages = [...currentSession.messages, { role: "user", content: input.trim() }];
    
    // Update session with new message
    setSessions(prev => ({
      ...prev,
      [activeSessionId]: {
        ...prev[activeSessionId],
        messages: newMessages,
        lastModified: new Date().toISOString(),
        title: prev[activeSessionId].title === "New Chat" ? generateSessionTitle(newMessages) : prev[activeSessionId].title,
        draft: "" // Clear draft after sending
      }
    }));
    
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const history = newMessages.map(m => `${m.role}: ${m.content}`).join("\n");
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
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

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              aiMessage += json.response;
              const updatedMessages = [...newMessages, { role: "ai", content: aiMessage }];
              setSessions(prev => ({
                ...prev,
                [activeSessionId]: {
                  ...prev[activeSessionId],
                  messages: updatedMessages,
                  lastModified: new Date().toISOString()
                }
              }));
            }
            if (json.error) {
              throw new Error(`Ollama API error: ${json.error}`);
            }
          } catch (e) {
            if (e.message.includes('Ollama API error')) {
              throw e;
            }
            console.error("JSON parse error:", e, "Raw line:", line);
          }
        }
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      const errorMessage = error.message.includes('Failed to fetch') 
        ? "Network error: Unable to connect to Ollama. Please check your connection and ensure Ollama is running."
        : `Error: ${error.message}`;
      
      const errorMessages = [...newMessages, { 
        role: "error", 
        content: errorMessage 
      }];
      
      setSessions(prev => ({
        ...prev,
        [activeSessionId]: {
          ...prev[activeSessionId],
          messages: errorMessages,
          lastModified: new Date().toISOString()
        }
      }));
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter sessions based on search query
  const filteredSessions = Object.values(sessions).filter(session => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      session.messages.some(msg => msg.content.toLowerCase().includes(query))
    );
  });

  // Sort sessions by last modified (most recent first)
  const sortedSessions = filteredSessions.sort((a, b) => 
    new Date(b.lastModified) - new Date(a.lastModified)
  );

  return (
    <div className={styles.chatContainer}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h3>Chat History</h3>
          <button 
            className={styles.closeSidebarButton}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
        
        <div className={styles.sidebarControls}>
          <button 
            className={styles.newChatButton}
            onClick={createNewSession}
            title="Start a new chat"
          >
            ➕ New Chat
          </button>
          
          <div className={styles.searchContainer}>
            <input
              className={styles.searchInput}
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className={styles.exportContainer}>
            <button 
              className={styles.exportButton}
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Export chat history"
            >
              📥 Export
            </button>
            {showExportMenu && (
              <div className={styles.exportMenu}>
                <button onClick={() => { exportToJSON(Object.values(sessions), activeSessionId); setShowExportMenu(false); }}>
                  Export as JSON
                </button>
                <button onClick={() => { exportToMarkdown(Object.values(sessions)); setShowExportMenu(false); }}>
                  Export as Markdown
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.sessionsList}>
          {sortedSessions.map(session => (
            <div 
              key={session.id}
              className={`${styles.sessionItem} ${activeSessionId === session.id ? styles.activeSession : ''}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <div className={styles.sessionItemContent}>
                <div className={styles.sessionTitle}>
                  {session.bookmarked && <span className={styles.bookmarkIcon}>⭐</span>}
                  {session.title}
                </div>
                <div className={styles.sessionDate}>
                  {new Date(session.lastModified).toLocaleDateString()}
                </div>
              </div>
              <div className={styles.sessionActions}>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(session.id); }}
                  className={styles.sessionActionButton}
                  title={session.bookmarked ? "Remove bookmark" : "Bookmark chat"}
                >
                  {session.bookmarked ? '⭐' : '☆'}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); duplicateSession(session.id); }}
                  className={styles.sessionActionButton}
                  title="Duplicate chat"
                >
                  📋
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  className={styles.sessionActionButton}
                  title="Delete chat"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerTopRow}>
            <div className={styles.headerLeft}>
              <button 
                className={styles.sidebarToggle}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle chat history sidebar"
              >
                📚
              </button>
              <span className={styles.headerTitle}>
                {activeSessionId && sessions[activeSessionId] ? sessions[activeSessionId].title : "Chat with TomAssist"}
              </span>
            </div>
            <div className={styles.headerControls}>
              <button
                onClick={handleToggleTheme}
                className={styles.themeToggleButton}
                title={theme === 'light' ? "Switch to Dark Theme" : "Switch to Light Theme"}
                aria-label={theme === 'light' ? "Switch to Dark Theme" : "Switch to Light Theme"}
              >
                {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
              </button>
              <div className={styles.modelSelector}>
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={styles.modelDropdown}
                  disabled={isLoading || modelsLoading}
                  title={modelsLoading ? "Loading models..." : (models.length > 0 ? "Select a model" : "No models available")}
                  aria-label="Select AI model"
                >
                  <option value="" disabled>
                    {modelsLoading ? "Loading models..." : 
                     models.length > 0 ? "Select a model" : "No models available"}
                  </option>
                  {models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
                {modelsLoading && <span className={styles.modelsLoading}>Loading...</span>}
              </div>
              <button 
                onClick={handleClearHistory} 
                className={styles.clearHistoryButton}
                disabled={currentMessages.length <= 1 && currentMessages[0]?.content === INITIAL_SYSTEM_MESSAGE.content}
                title="Clear current chat"
                aria-label="Clear current chat"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        
        <div className={styles.messagesContainer}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          {currentMessages.map((message, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${
                message.role === 'user' 
                  ? styles.userMessage 
                  : message.role === 'system' 
                    ? styles.systemMessage 
                    : message.role === 'error'
                      ? styles.errorMessage
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
                          <div className={styles.codeBlockWrapper}>
                            <button
                              className={styles.copyCodeButton}
                              onClick={async (e) => {
                                const buttonElement = e.target;
                                const codeToCopy = String(children).replace(/\n$/, '');
                                try {
                                  await navigator.clipboard.writeText(codeToCopy);
                                  buttonElement.textContent = 'Copied!';
                                  setTimeout(() => {
                                    if (buttonElement) {
                                      buttonElement.textContent = 'Copy';
                                    }
                                  }, 2000);
                                } catch (err) {
                                  console.error('Failed to copy code:', err);
                                  buttonElement.textContent = 'Error!';
                                  setTimeout(() => {
                                    if (buttonElement) {
                                      buttonElement.textContent = 'Copy';
                                    }
                                  }, 2000);
                                }
                              }}
                              aria-label="Copy code to clipboard"
                            >
                              Copy
                            </button>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
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
              <span>TomAssist is thinking</span>
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
            placeholder="Ask TomAssist something..."
            disabled={isLoading || !selectedModel}
            aria-label="Type your message here"
          />
          <button 
            className={styles.sendButton} 
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || !selectedModel}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}