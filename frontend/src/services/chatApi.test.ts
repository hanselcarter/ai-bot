import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessage, streamMessage } from './chatApi';

describe('chatApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message and return response', async () => {
      const mockResponse = { reply: 'Hello from bot' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sendMessage('Hello');

      expect(fetch).toHaveBeenCalledWith('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should throw error for empty message (400)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(sendMessage('')).rejects.toThrow('Message cannot be empty.');
    });

    it('should throw error for rate limit (429)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      await expect(sendMessage('test')).rejects.toThrow('Too many requests. Please wait a moment.');
    });

    it('should throw generic error for other failures', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(sendMessage('test')).rejects.toThrow('Connection lost, please retry.');
    });
  });

  describe('streamMessage', () => {
    it('should stream tokens and call callbacks', async () => {
      const tokens: string[] = [];
      const onToken = vi.fn((token: string) => tokens.push(token));
      const onComplete = vi.fn();
      const onError = vi.fn();

      const encoder = new TextEncoder();
      const streamData = [
        'data: {"token":"Hello"}\n\n',
        'data: {"token":" World"}\n\n',
        'data: {"done":true}\n\n',
      ];

      let index = 0;
      const mockReader = {
        read: vi.fn().mockImplementation(() => {
          if (index < streamData.length) {
            return Promise.resolve({
              done: false,
              value: encoder.encode(streamData[index++]),
            });
          }
          return Promise.resolve({ done: true, value: undefined });
        }),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      await streamMessage('test', onToken, onComplete, onError);

      expect(onToken).toHaveBeenCalledWith('Hello');
      expect(onToken).toHaveBeenCalledWith(' World');
      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(tokens).toEqual(['Hello', ' World']);
    });

    it('should handle stream errors', async () => {
      const onToken = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      const encoder = new TextEncoder();
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({
            done: false,
            value: encoder.encode('data: {"error":"Server error"}\n\n'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: { getReader: () => mockReader },
      });

      await streamMessage('test', onToken, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Server error');
    });

    it('should handle fetch failure', async () => {
      const onToken = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await streamMessage('test', onToken, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Network error');
    });

    it('should handle rate limit on stream', async () => {
      const onToken = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      await streamMessage('test', onToken, onComplete, onError);

      expect(onError).toHaveBeenCalledWith('Too many requests. Please wait a moment.');
    });
  });
});
