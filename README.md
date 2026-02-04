# Software Engineering AI Chat Assistant

An AI-powered chat application featuring a **Software Engineering Expert** assistant built with NestJS, React, and LangChain. The assistant uses RAG (Retrieval-Augmented Generation) to answer questions about design patterns, testing best practices, and clean code principles.

---

## ⚠️ IMPORTANT: OpenAI API Key Required

> **This application requires an OpenAI API key to function.**
>
> Without a valid API key, the AI assistant will not be able to respond to your questions.

### Get Your API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Create a new API key
4. Copy the key (you won't be able to see it again!)

---

## 🚀 Quick Start (Docker - Recommended)

Run the entire application with a single command - no Node.js installation required!

### Step 1: Set Up Environment

```bash
# Copy the example environment file
cp .env.example .env
```

### Step 2: Add Your API Key

Open `.env` and add your OpenAI API key:

```env
# ⚠️ REQUIRED - Get your key from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-actual-api-key-here

# Optional: Change the model (default: gpt-3.5-turbo)
OPENAI_MODEL=gpt-3.5-turbo
```

### Step 3: Run with Docker

```bash
docker-compose up --build
```

### Step 4: Open the App

- **Frontend:** http://localhost
- **Backend API:** http://localhost:3000

That's it! Start chatting with your AI Software Engineering assistant.

---

## 💻 Local Development

### Prerequisites

- Node.js 20+
- npm

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# ⚠️ Edit .env and add your OPENAI_API_KEY!

# Start development server
npm run start:dev
```

Backend runs on http://localhost:3000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:5173

---

## 🏗️ Project Structure

```
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── chat/               # Chat module
│   │   │   ├── entities/       # TypeORM entities (SQLite)
│   │   │   ├── dto/            # Data transfer objects
│   │   │   └── guards/         # Rate limiting
│   │   ├── llm/                # LLM integration
│   │   │   ├── knowledge/      # RAG knowledge base (.md files)
│   │   │   ├── llm.module.ts
│   │   │   └── llm.service.ts  # OpenAI + LangChain
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                   # Unit tests
│   ├── Dockerfile
│   └── .env.example
├── frontend/                   # React + Vite client
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example                # ⚠️ Copy this to .env
└── README.md
```

---

## 🤖 Features

### AI Assistant Capabilities

The assistant specializes in **software engineering topics**:

- **Design Patterns** - Singleton, Factory, Observer, Strategy, etc.
- **Testing Best Practices** - Unit testing, TDD, mocking strategies
- **Clean Code Principles** - SOLID, naming conventions, refactoring

For off-topic questions, the assistant will politely redirect to software engineering topics.

### Technical Features

- **RAG (Retrieval-Augmented Generation)** - Context-aware responses using embedded knowledge documents
- **Token Streaming** - Real-time "typing" effect as AI generates responses
- **SQLite Persistence** - Chat history persists across server restarts
- **Rate Limiting** - 5 requests per minute per IP
- **Docker Support** - Single command deployment
- **Input Validation** - Robust error handling

---

## 📡 API Documentation

### POST /chat

Send a message and receive an AI response.

**Request:**
```json
{
  "message": "What is the Singleton pattern?"
}
```

**Response:**
```json
{
  "reply": "The Singleton pattern ensures a class has only one instance..."
}
```

**Errors:**
- `400 Bad Request` - Empty or missing message
- `429 Too Many Requests` - Rate limit exceeded

### POST /chat/stream

Stream AI response tokens in real-time (Server-Sent Events).

**Request:**
```json
{
  "message": "What is the Singleton pattern?"
}
```

**Response (SSE stream):**
```
data: {"token":"The"}
data: {"token":" Singleton"}
data: {"token":" pattern"}
data: {"token":" ensures..."}
data: {"done":true}
```

### GET /chat/history

Get chat history for the current session.

**Response:**
```json
[
  {
    "id": "uuid-here",
    "text": "What is the Singleton pattern?",
    "sender": "user",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "uuid-here",
    "text": "The Singleton pattern ensures...",
    "sender": "bot",
    "timestamp": "2024-01-15T10:30:01.000Z"
  }
]
```

---

## 🧪 Testing

### Run All Tests

```bash
# Backend tests (18 tests)
cd backend && npm test

# Frontend tests (18 tests)
cd frontend && npm test
```

### Sample Questions & Expected Responses

#### 1. Design Pattern Question
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the Singleton pattern?"}'
```
**Expected:** Response explaining that Singleton ensures a class has only one instance, mentions private constructor, static getInstance() method, and use cases like configuration managers or logging services.

#### 2. Testing Question
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How should I structure unit tests?"}'
```
**Expected:** Response covering Arrange-Act-Assert pattern, test isolation, descriptive naming, and keeping tests independent. May mention the testing pyramid.

#### 3. Off-Topic Question (Should Redirect)
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the best recipe for pasta?"}'
```
**Expected:** Polite redirect like "I specialize in software engineering topics. Feel free to ask about design patterns, testing, clean code, or development practices!"

#### Get Chat History
```bash
curl http://localhost:3000/chat/history
```

---

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | **Yes** | - | Your OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-3.5-turbo` | OpenAI model to use |
| `DATABASE_PATH` | No | `data/chat.db` | SQLite database path |

---

## 📝 Adding Knowledge

To extend the AI's knowledge, add markdown files to `backend/src/llm/knowledge/`:

```markdown
# Topic Name

## Section 1
Content about the topic...

## Section 2
More content...
```

The files are automatically loaded and embedded when the server starts.

---

## 🛠️ Troubleshooting

### "LLM service is not configured"

Your API key is missing or invalid. Check:
1. `.env` file exists in the project root (for Docker) or `backend/` (for local dev)
2. `OPENAI_API_KEY` is set correctly
3. The API key is valid and has credits

### "Failed to get response from AI service"

- Check your OpenAI API quota/credits
- Verify your API key has the correct permissions
- Check network connectivity

### Docker build fails

```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 📄 License

MIT
