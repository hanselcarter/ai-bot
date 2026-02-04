import { ChatResponse } from '../types/chat';

const API_URL = '/chat';

export async function sendMessage(message: string): Promise<ChatResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('Message cannot be empty.');
    }
    if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment.');
    }
    throw new Error('Connection lost, please retry.');
  }

  return response.json();
}

export async function streamMessage(
  message: string,
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    // Use POST to avoid URL length limits and log leakage
    const response = await fetch(`${API_URL}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Message cannot be empty.');
      }
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment.');
      }
      throw new Error('Connection lost, please retry.');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming not supported');
    }

    // TextDecoder to handle multibyte characters split across chunks
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Flush decoder and process any remaining buffer
        buffer += decoder.decode();
        if (buffer.trim()) {
          processLine(buffer, onToken, onComplete, onError);
        }
        break;
      }

      // Decode with streaming mode to handle split multibyte characters
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (processLine(line, onToken, onComplete, onError)) {
          return; // Early exit if done or error
        }
      }
    }

    onComplete();
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Connection lost, please retry.');
  }
}

function processLine(
  line: string,
  onToken: (token: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data: ')) {
    return false;
  }

  try {
    const data = JSON.parse(trimmed.slice(6));
    if (data.token) {
      onToken(data.token);
    }
    if (data.done) {
      onComplete();
      return true;
    }
    if (data.error) {
      onError(data.error);
      return true;
    }
  } catch {
    // Incomplete JSON, will be handled in next chunk
  }
  return false;
}
