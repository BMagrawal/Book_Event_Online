
## ⚙️ Environment Variables

Create `.env.local`


NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

AUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000


---

## 🧪 Run Locally

```bash
npm install
npm run dev
🔑 Google OAuth Setup

Create project in Google Cloud Console

Create OAuth Client (Web application)

Add redirect:

http://localhost:3000/api/auth/callback/google
🗄️ Supabase Setup

Create project

Copy API keys

Create events table

Enable RLS if needed

