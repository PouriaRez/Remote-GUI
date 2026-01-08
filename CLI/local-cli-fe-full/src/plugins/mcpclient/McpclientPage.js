import React, { useState, useEffect, useRef } from 'react';
import {
  getMCPStatus,
  connectMCP,
  disconnectMCP,
  listMCPTools,
  askMCP,
} from './mcpclient_api';
import MarkdownRenderer from './MarkdownRenderer';

// Plugin metadata - used by the plugin loader
export const pluginMetadata = {
  name: 'MCP Client',
  icon: null
};

const McpclientPage = ({ node }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [tools, setTools] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [answers, setAnswers] = useState([]);
  const [asking, setAsking] = useState(false);
  const [anylogUrl, setAnylogUrl] = useState('http://50.116.13.109:32349/mcp/sse');
  const [ollamaModel, setOllamaModel] = useState('qwen2.5:7b-instruct');
  const [showConfig, setShowConfig] = useState(false);
  const messagesEndRef = useRef(null);
  const previousModelRef = useRef(ollamaModel);
  const isInitialMountRef = useRef(true);
  const HISTORY_STORAGE_KEY = 'mcpclient_chat_history';
  const PENDING_REQUEST_KEY = 'mcpclient_pending_request';
  const requestStartTimeRef = useRef(null);
  const answersRef = useRef([]); // Track current answers for synchronous access

  // Load conversation history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAnswers(parsed);
            answersRef.current = parsed;
            
            // If last message is a response, ensure asking is false
            const lastMessage = parsed[parsed.length - 1];
            if (lastMessage && (lastMessage.type === 'assistant' || lastMessage.type === 'error')) {
              setAsking(false);
            }
          }
        } catch (parseErr) {
          console.warn('Failed to parse saved history:', parseErr);
        }
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    }
    loadStatus();
  }, []);

  // Update ref whenever answers change
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);


  useEffect(() => {
    scrollToBottom();
  }, [answers]);

  // Auto-reconnect when model changes (if already connected)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousModelRef.current = ollamaModel;
      return;
    }

    // Only reconnect if model changed and we're currently connected
    if (previousModelRef.current !== ollamaModel && connected) {
      console.log(`Model changed from ${previousModelRef.current} to ${ollamaModel}. Reconnecting...`);
      const oldModel = previousModelRef.current;
      previousModelRef.current = ollamaModel;
      
      // Auto-reconnect with new model
      const reconnect = async () => {
        try {
          setError(null);
          setLoading(true);
          // Disconnect first
          await disconnectMCP();
          // Then connect with new model
          const result = await connectMCP(anylogUrl || null, ollamaModel || null);
          setConnected(true);
          // Update status with fresh data
          const freshStatus = await getMCPStatus();
          setStatus(freshStatus);
          await loadTools();
        } catch (err) {
          console.error('Failed to reconnect with new model:', err);
          setError(`Failed to reconnect with new model: ${err.message}`);
          setConnected(false);
          // Revert model on error
          previousModelRef.current = oldModel;
          setOllamaModel(oldModel);
        } finally {
          setLoading(false);
        }
      };
      
      reconnect();
    } else if (previousModelRef.current !== ollamaModel) {
      // Model changed but not connected - just update the ref
      previousModelRef.current = ollamaModel;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ollamaModel, connected, anylogUrl]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fast status check (uses cached tools, no network calls)
      const statusData = await getMCPStatus();
      setStatus(statusData);
      setConnected(statusData.connected);
      
      // Set URL and model from status if available
      if (statusData.anylog_url) {
        setAnylogUrl(statusData.anylog_url);
      }
      if (statusData.current_model) {
        setOllamaModel(statusData.current_model);
        // Update ref to prevent unnecessary reconnection
        previousModelRef.current = statusData.current_model;
      }
      
      // Set tools from status (already cached, no extra API call needed)
      if (statusData.available_tools && statusData.available_tools.length > 0) {
        setTools(statusData.available_tools.map(name => ({ name })));
      }
      
      // Stop loading here - show page immediately
      setLoading(false);
      
      // Auto-connect in background if not connected (non-blocking)
      if (!statusData.connected) {
        const defaultUrl = 'http://50.116.13.109:32349/mcp/sse';
        const defaultModel = 'qwen2.5:7b-instruct';
        // Connect in background without blocking UI
        connectMCP(defaultUrl, defaultModel)
          .then((result) => {
            setConnected(true);
            setStatus({
              ...statusData,
              connected: true,
              available_tools: result.available_tools || [],
            });
            setAnylogUrl(defaultUrl);
            setOllamaModel(defaultModel);
            // Tools already returned from connect, no need for separate loadTools() call
            if (result.available_tools && result.available_tools.length > 0) {
              setTools(result.available_tools.map(name => ({ name })));
            }
          })
          .catch((connectErr) => {
            console.error('Auto-connect failed:', connectErr);
            // Show error but allow manual retry
            setError(`Auto-connect failed: ${connectErr.message}. Please try connecting manually.`);
          });
      } else {
        // Already connected - load full tool details if needed (but don't block)
        // Tools are already in status, but we might want full details
        loadTools().catch(err => {
          console.warn('Failed to load tool details:', err);
          // Non-critical, don't show error
        });
      }
    } catch (err) {
      console.error('Failed to load status:', err);
      setLoading(false);
      // Try auto-connect in background anyway
      const defaultUrl = 'http://50.116.13.109:32349/mcp/sse';
      const defaultModel = 'qwen2.5:7b-instruct';
      connectMCP(defaultUrl, defaultModel)
        .then((result) => {
          setConnected(true);
          setStatus({
            connected: true,
            available_tools: result.available_tools || [],
            ollama_available: true,
            mcp_available: true,
            current_model: defaultModel,
            anylog_url: defaultUrl
          });
          setAnylogUrl(defaultUrl);
          setOllamaModel(defaultModel);
          if (result.available_tools && result.available_tools.length > 0) {
            setTools(result.available_tools.map(name => ({ name })));
          }
        })
        .catch((connectErr) => {
          console.error('Auto-connect failed:', connectErr);
          setError(`Auto-connect failed: ${connectErr.message}. Please try connecting manually.`);
        });
    }
  };

  const loadTools = async () => {
    try {
      const toolsData = await listMCPTools();
      setTools(toolsData.tools || []);
    } catch (err) {
      console.error('Failed to load tools:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await connectMCP(anylogUrl || null, ollamaModel || null);
      setConnected(true);
      setStatus({
        ...status,
        connected: true,
        available_tools: result.available_tools || [],
      });
      // Tools already returned from connect, no need for separate loadTools() call
      if (result.available_tools && result.available_tools.length > 0) {
        setTools(result.available_tools.map(name => ({ name })));
      } else {
        // Only load full tool details if not provided
        await loadTools();
      }
      setShowConfig(false);
      // Clear any previous errors on successful connection
      setError(null);
    } catch (err) {
      console.error('Failed to connect:', err);
      const errorMessage = err.message || err.toString() || 'Unknown error occurred';
      console.error('Error details:', {
        message: errorMessage,
        error: err,
        stack: err.stack
      });
      setError(errorMessage);
      // Keep error visible - don't clear it
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      setLoading(true);
      await disconnectMCP();
      setConnected(false);
      setStatus({
        ...status,
        connected: false,
        available_tools: [],
      });
      setTools([]);
      setAnswers([]);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (retryPrompt = null) => {
    const userPrompt = retryPrompt || prompt.trim();
    if (!userPrompt || asking) return;

    if (!retryPrompt) {
      setPrompt('');
    }
    
    setAsking(true);
    setError(null);

    // Add user message to chat immediately
    setAnswers(prev => {
      const newAnswers = [...prev, { type: 'user', content: userPrompt }];
      answersRef.current = newAnswers;
      return newAnswers;
    });

    // Add thinking message
    setAnswers(prev => {
      const withThinking = [...prev, { type: 'thinking', content: 'Thinking...' }];
      answersRef.current = withThinking;
      return withThinking;
    });

    try {
      // Build conversation history from current answers (excluding thinking and errors)
      const currentAnswers = answersRef.current;
      const conversationHistory = currentAnswers
        .filter(msg => msg.type === 'user' || msg.type === 'assistant')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // Call API
      const result = await askMCP(
        userPrompt, 
        anylogUrl || null, 
        ollamaModel || null,
        conversationHistory.length > 0 ? conversationHistory : null
      );
      
      // Validate response
      if (!result || (!result.answer && !result.content)) {
        throw new Error('Invalid response from server: missing answer field');
      }
      
      const responseContent = result.answer || result.content || 'No response received';
      
      // Update state: remove thinking, add assistant response
      setAnswers(prev => {
        const withoutThinking = prev.filter(msg => msg.type !== 'thinking');
        const updated = [...withoutThinking, { type: 'assistant', content: responseContent }];
        answersRef.current = updated;
        
        // Save to localStorage immediately
        try {
          const persistent = updated.filter(msg => msg.type !== 'thinking');
          if (persistent.length > 0) {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(persistent.slice(-20)));
          }
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
        
        return updated;
      });
      
      setAsking(false);
      
    } catch (err) {
      console.error('Failed to ask question:', err);
      setError(err.message);
      
      // Update state: remove thinking, add error
      setAnswers(prev => {
        const withoutThinking = prev.filter(msg => msg.type !== 'thinking');
        const errorMsg = {
          type: 'error',
          content: err.message,
          failedPrompt: userPrompt
        };
        const updated = [...withoutThinking, errorMsg];
        answersRef.current = updated;
        
        // Save to localStorage immediately
        try {
          const persistent = updated.filter(msg => msg.type !== 'thinking');
          if (persistent.length > 0) {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(persistent.slice(-20)));
          }
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
        
        return updated;
      });
      
      setAsking(false);
    }
  };


  const handleRetry = (failedPrompt) => {
    if (failedPrompt) {
      handleAsk(failedPrompt);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear chat history? This cannot be undone.')) {
      setAnswers([]);
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (loading && !status) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        padding: '20px'
      }}>
        <p>Loading MCP Client...</p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      overflow: 'hidden',
      backgroundColor: '#f8f9fa'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #007bff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          margin: 0,
          color: '#333',
          fontSize: '24px',
          fontWeight: '600',
          borderBottom: '2px solid #007bff',
          paddingBottom: '10px',
          display: 'inline-block'
        }}>
          MCP Client
        </h2>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {status && (
            <div style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: connected ? '#d4edda' : '#f8d7da',
              color: connected ? '#155724' : '#721c24',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {connected ? '● Connected' : '○ Disconnected'}
            </div>
          )}
          <button
            onClick={handleClearHistory}
            disabled={answers.length === 0}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: answers.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: answers.length === 0 ? 0.6 : 1
            }}
          >
            🗑️ Clear History
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ⚙️ Config
          </button>
          {connected ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading || !anylogUrl.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: (loading || !anylogUrl.trim()) ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: (loading || !anylogUrl.trim()) ? 0.6 : 1
              }}
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div style={{
          padding: '20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #dee2e6',
          flexShrink: 0
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                AnyLog MCP SSE URL:
              </label>
              <input
                type="text"
                value={anylogUrl}
                onChange={(e) => setAnylogUrl(e.target.value)}
                placeholder="http://10.0.0.78:7849/mcp/sse"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Ollama Model:
              </label>
              <select
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="qwen2.5:7b-instruct">qwen2.5:7b-instruct</option>
                <option value="gpt-oss:20b">gpt-oss:20b</option>
                <option value="mistral:7b-instruct">mistral:7b-instruct</option>
                <option value="llama3.1:8b-instruct">llama3.1:8b-instruct</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#f8d7da',
          border: '2px solid #dc3545',
          borderRadius: '6px',
          margin: '20px',
          color: '#721c24',
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(220, 53, 69, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <strong style={{ fontSize: '16px' }}>Connection Error</strong>
          </div>
          <div style={{ marginLeft: '30px', fontSize: '14px', lineHeight: '1.5' }}>
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              fontSize: '12px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status Info */}
      {status && (
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '6px',
          margin: '20px',
          flexShrink: 0,
          fontSize: '14px'
        }}>
          <strong>Status:</strong> {status.ollama_available ? '✅ Ollama available' : '❌ Ollama not available'} |{' '}
          {status.mcp_available ? '✅ MCP available' : '❌ MCP not available'}
          {connected && status.available_tools && status.available_tools.length > 0 && (
            <span> | {status.available_tools.length} tool(s) available</span>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '20px'
      }}>
        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          {answers.length === 0 ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: '#6c757d',
              fontSize: '16px'
            }}>
              {connected ? 'Start asking questions...' : 'Connect to MCP to start chatting'}
            </div>
          ) : (
            <div>
              {answers.map((answer, index) => {
                // Skip thinking messages - they're handled separately or already in answers
                if (answer.type === 'thinking') {
                  return (
                    <div
                      key={`thinking-${answer.timestamp || index}`}
                      style={{
                        marginBottom: '20px',
                        padding: '15px',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        borderLeft: '4px solid #6c757d',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#6c757d' }}>
                        Assistant
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>{answer.content}</span>
                        <span style={{ fontSize: '18px' }}>⏳</span>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: '20px',
                      padding: '15px',
                      borderRadius: '8px',
                      backgroundColor: answer.type === 'user' ? '#e7f3ff' : answer.type === 'error' ? '#ffe7e7' : '#f8f9fa',
                      borderLeft: `4px solid ${answer.type === 'user' ? '#007bff' : answer.type === 'error' ? '#dc3545' : '#28a745'}`
                    }}
                  >
                    <div style={{
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: answer.type === 'user' ? '#007bff' : answer.type === 'error' ? '#dc3545' : '#28a745'
                    }}>
                      {answer.type === 'user' ? '👤 You' : answer.type === 'error' ? '❌ Error' : 'Assistant'}
                    </div>
                    <div style={{ lineHeight: '1.6' }}>
                      {answer.type === 'assistant' ? (
                        <MarkdownRenderer content={answer.content} />
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{answer.content}</div>
                      )}
                    </div>
                    {answer.type === 'error' && answer.failedPrompt && (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleRetry(answer.failedPrompt)}
                          disabled={asking}
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: asking ? 'not-allowed' : 'pointer',
                            fontWeight: '500',
                            opacity: asking ? 0.6 : 1
                          }}
                        >
                          🔄 Retry
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Show additional thinking indicator if asking but no thinking message in answers yet */}
              {asking && !answers.some(msg => msg.type === 'thinking') && (
                <div style={{
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  borderLeft: '4px solid #6c757d',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', color: '#6c757d' }}>
                    Assistant
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Thinking...</span>
                    <span style={{ fontSize: '18px' }}>⏳</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          display: 'flex',
          gap: '10px',
          flexShrink: 0
        }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={connected ? "Ask a question..." : "Connect to MCP first..."}
            disabled={!connected || asking}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'none',
              minHeight: '60px',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handleAsk}
            disabled={!connected || asking || !prompt.trim()}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              background: connected && prompt.trim() ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (connected && prompt.trim() && !asking) ? 'pointer' : 'not-allowed',
              fontWeight: '500',
              opacity: (connected && prompt.trim() && !asking) ? 1 : 0.6
            }}
          >
            {asking ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default McpclientPage;

