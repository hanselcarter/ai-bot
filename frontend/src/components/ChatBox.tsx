import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Message } from '../types/chat';
import { streamMessage } from '../services/chatApi';
import './ChatBox.css';

const SUGGESTIONS = [
  'What is the Singleton pattern?',
  'Explain SOLID principles',
  'How to write unit tests?',
];

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendMessageHandler = async (text: string) => {
    const trimmedInput = text.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);
    setStreamingText('');

    const userMessage: Message = {
      id: generateId(),
      text: trimmedInput,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    let fullResponse = '';

    await streamMessage(
      trimmedInput,
      (token) => {
        fullResponse += token;
        setStreamingText(fullResponse);
      },
      () => {
        const botMessage: Message = {
          id: generateId(),
          text: fullResponse,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setStreamingText('');
        setIsLoading(false);
        inputRef.current?.focus();
      },
      (errorMsg) => {
        setError(errorMsg);
        setStreamingText('');
        setIsLoading(false);
        inputRef.current?.focus();
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageHandler(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessageHandler(suggestion);
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-icon">🧠</div>
        <div className="header-content">
          <div className="header-title">Software Engineering Expert</div>
          <div className="header-subtitle">Design patterns, testing, clean code</div>
        </div>
        <div className="header-status">
          <span className="status-dot"></span>
          Online
        </div>
      </div>

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 && !isLoading ? (
          <div className="empty-state">
            <div className="empty-icon">💡</div>
            <div className="empty-title">Ask me anything about software engineering</div>
            <div className="empty-description">
              I can help with design patterns, testing strategies, clean code principles, and development best practices.
            </div>
            <div className="suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-wrapper ${message.sender}`}
              >
                <div className={`avatar ${message.sender}`}>
                  {message.sender === 'bot' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}>
                    {message.sender === 'bot' ? (
                      <Markdown>{message.text}</Markdown>
                    ) : (
                      message.text
                    )}
                  </div>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="typing-indicator">
                <div className="avatar bot">🤖</div>
                <div className="typing-bubble">
                  {streamingText ? (
                    <Markdown>{streamingText}</Markdown>
                  ) : (
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="input-area">
        <div className="input-wrapper">
          <div className="input-field">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about design patterns, testing, clean code..."
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            ➤
          </button>
        </div>
        <div className="input-hint">Press Enter to send • Powered by AI</div>
      </form>
    </div>
  );
}
