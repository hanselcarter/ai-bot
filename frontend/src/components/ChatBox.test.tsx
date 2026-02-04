import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatBox from './ChatBox';
import * as chatApi from '../services/chatApi';

vi.mock('../services/chatApi');

describe('ChatBox', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render empty state with suggestions', () => {
    render(<ChatBox />);

    expect(screen.getByText('Software Engineering Expert')).toBeInTheDocument();
    expect(screen.getByText('Ask me anything about software engineering')).toBeInTheDocument();
    expect(screen.getByText('What is the Singleton pattern?')).toBeInTheDocument();
    expect(screen.getByText('Explain SOLID principles')).toBeInTheDocument();
    expect(screen.getByText('How to write unit tests?')).toBeInTheDocument();
  });

  it('should have disabled send button when input is empty', () => {
    render(<ChatBox />);

    const sendButton = screen.getByRole('button', { name: /➤/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when input has text', async () => {
    const user = userEvent.setup();
    render(<ChatBox />);

    const input = screen.getByPlaceholderText(/Ask about design patterns/i);
    await user.type(input, 'Hello');

    const sendButton = screen.getByRole('button', { name: /➤/i });
    expect(sendButton).not.toBeDisabled();
  });

  it('should send message on form submit', async () => {
    const user = userEvent.setup();
    vi.mocked(chatApi.streamMessage).mockImplementation(
      async (_msg, onToken, onComplete) => {
        onToken('Hello');
        onToken(' there');
        onComplete();
      }
    );

    render(<ChatBox />);

    const input = screen.getByPlaceholderText(/Ask about design patterns/i);
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(chatApi.streamMessage).toHaveBeenCalledWith(
        'Test message',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('should display user message immediately', async () => {
    const user = userEvent.setup();
    vi.mocked(chatApi.streamMessage).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    render(<ChatBox />);

    const input = screen.getByPlaceholderText(/Ask about design patterns/i);
    await user.type(input, 'My question');
    await user.keyboard('{Enter}');

    expect(screen.getByText('My question')).toBeInTheDocument();
  });

  it('should clear input after sending', async () => {
    const user = userEvent.setup();
    vi.mocked(chatApi.streamMessage).mockImplementation(
      async (_msg, _onToken, onComplete) => {
        onComplete();
      }
    );

    render(<ChatBox />);

    const input = screen.getByPlaceholderText(/Ask about design patterns/i) as HTMLInputElement;
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should send suggestion when clicked', async () => {
    vi.mocked(chatApi.streamMessage).mockImplementation(
      async (_msg, _onToken, onComplete) => {
        onComplete();
      }
    );

    render(<ChatBox />);

    const suggestionButton = screen.getByText('What is the Singleton pattern?');
    fireEvent.click(suggestionButton);

    await waitFor(() => {
      expect(chatApi.streamMessage).toHaveBeenCalledWith(
        'What is the Singleton pattern?',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('should display error message on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(chatApi.streamMessage).mockImplementation(
      async (_msg, _onToken, _onComplete, onError) => {
        onError('Connection failed');
      }
    );

    render(<ChatBox />);

    const input = screen.getByPlaceholderText(/Ask about design patterns/i);
    await user.type(input, 'Test');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  it('should display streaming text while loading', async () => {
    const user = userEvent.setup();
    let resolveStream: () => void;
    const streamPromise = new Promise<void>((resolve) => {
      resolveStream = resolve;
    });

    vi.mocked(chatApi.streamMessage).mockImplementation(
      async (_msg, onToken, onComplete) => {
        onToken('Streaming');
        onToken(' text');
        await streamPromise;
        onComplete();
      }
    );

    render(<ChatBox />);

    const input = screen.getByPlaceholderText(/Ask about design patterns/i);
    await user.type(input, 'Test');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Streaming text')).toBeInTheDocument();
    });

    resolveStream!();
  });

  it('should disable input while loading', async () => {
    const user = userEvent.setup();

    vi.mocked(chatApi.streamMessage).mockImplementation(
      async (_msg, _onToken, onComplete) => {
        // Simulate async delay then complete
        await new Promise((r) => setTimeout(r, 50));
        onComplete();
      }
    );

    render(<ChatBox />);

    const input = screen.getByPlaceholderText(/Ask about design patterns/i) as HTMLInputElement;
    await user.type(input, 'Test');

    // Before submit, input should be enabled
    expect(input).not.toBeDisabled();

    await user.keyboard('{Enter}');

    // During loading, input should be disabled
    expect(input).toBeDisabled();

    // After completion, input should be enabled again
    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
  });
});
