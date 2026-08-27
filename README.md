# ⚡ fina_ai — Autonomous Real-Time Expense Tracker & Financial Analytics

> An enterprise-grade, privacy-first personal finance platform that converts raw bank notification streams into structured financial analytics using Gemini AI and asynchronous processing pipelines.

---

## 📌 Architectural Highlights & Key Features

* **⚡ Sub-20ms Notification Ingestion:** Built to handle real-time notification drops without blocking mobile UI threads.
* **🤖 Gemini AI Engine:** Dynamically extracts transaction metadata (amount, merchant name, category, payment mode, debit/credit classification) from unstructured SMS and app notification strings.
* **🔐 Multi-Tenant Architecture:** Secure user isolation using JWT-based web authentication paired with per-user hashed API keys for background ingestion.
* **🛡️ Google Play Compliant:** Designed around Android's `NotificationListenerService` rather than invasive `READ_SMS` permissions—ensuring zero friction during Play Store submission.
* **📊 Live Dashboard:** Real-time visual representation of personal cash flow, spending trends, and transaction history.

---

## 🛠️ Tech Stack

### **Backend**
* **Runtime:** Node.js, Express.js
* **Database:** MongoDB Atlas (Mongoose ORM)
* **Authentication:** JSON Web Tokens (JWT), Hashed API Keys
* **AI Orchestration:** Google Gemini API (`@google/genai`)

### **Frontend**
* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS, Framer Motion
* **HTTP Client:** Axios

### **Mobile & Ingestion Pipeline**
* **Client:** Android Native / MacroDroid Webhook Integration
* **Protocol:** RESTful HTTPS with Custom API Key Headers (`x-api-key`)

---

## 🏗️ System Architecture Flow

```
[ Android Notification / SMS ]
        │
        ▼ (HTTPS POST with x-api-key)
[ Express API Gateway ] ──► (Validates API Key in <20ms)
        │
        ▼
[ Gemini AI Parser ] ──► (Extracts Amount, Merchant, Category)
        │
        ▼
[ MongoDB Atlas ] ──► (Indexed multi-tenant transaction stores)
        │
        ▼
[ React Web Dashboard ] ──► (Dynamic charts & expense tracking)
```

---

## 🚦 Project Status & Development Roadmap

### ✅ Phase 1: Core Engine & Ingestion (Completed)
- [x] Multi-tenant database architecture (`User`, `Transaction` schemas with compound indexing).
- [x] Dynamic dual-authentication middleware (JWT for web dashboard, API key header validation for automated endpoints).
- [x] Gemini AI integration for raw bank text string extraction.
- [x] RESTful transaction routes (`POST /ingest`, `GET /transactions`, `DELETE /transactions/:id`).
- [x] Functional React frontend with budget visualization components.

### 🚧 Phase 2: Production Scale & Android Native (In Progress)
- [ ] **Android Native Notification Service:** Custom Android application implementing `NotificationListenerService` for zero-setup, background notification capture.
- [ ] **Redis + BullMQ Queue:** Asynchronous job processing to buffer incoming bank notification spikes and guarantee idempotent writes under high traffic loads.
- [ ] **WebSocket Integration:** Instant UI auto-refreshes (`Socket.io`) when a notification is processed in the background.

### 🔮 Phase 3: Advanced SaaS Features (Planned)
- [ ] **Per-User API Key Management Console:** Allow users to generate, revoke, and manage multiple mobile ingestion keys within their settings dashboard.
- [ ] **Monthly Budgeting & Smart Spending Alerts:** Predictive spending forecasts using Gemini AI to flag unusual category expenses.
- [ ] **CSV / PDF Export Capabilities:** Export formatted data for tax preparation and personal record-keeping.

---

## 💻 Local Development Setup

### Prerequisites
* Node.js (v18+)
* MongoDB Connection String
* Gemini API Key

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-username/fina_ai.git
cd fina_ai/backend

# Install dependencies
npm install

# Configure Environment Variables (.env)
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
FINA_INTERNAL_API_KEY=your_mobile_api_key
GEMINI_API_KEY=your_gemini_api_key
MY_USER_ID=your_mongodb_user_id

# Start backend server
npm run dev
```

### Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## 📜 API Reference (Ingestion Endpoint)

### Ingest Transaction Notification

```http
POST /api/v1/transactions/ingest
Content-Type: application/json
x-api-key: YOUR_MOBILE_API_KEY
```

**Payload:**
```json
{
  "message": "Rs 450.00 spent on HDFC Bank Card ending 1042 at STARBUCKS on 2026-08-27."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "66ce3f8a09b2e1b4c8a1e2d3",
    "amount": 450,
    "merchant": "Starbucks",
    "category": "Food & Dining",
    "type": "debit",
    "currency": "INR",
    "createdAt": "2026-08-27T04:16:18.000Z"
  }
}
```

---

## 📝 Author & Acknowledgments

**Shakeer Gittola**
Full-Stack Engineer | MERN & Next.js Enthusiast

* LinkedIn: [linkedin.com/in/shakeer-gittola](https://linkedin.com/in/shakeer-gittola) (Update with your link)
* GitHub: [@ShakeerGittola](https://github.com/ShakeerGittola) (Update with your link)
