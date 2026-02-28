# Car-Maintenance

## Frontend

Prerequisites:
- Node.js 18+ and npm
- Backend running on http://localhost:8080

From repo root:
1. `cd frontend`
2. `npm install`
3. `npm run dev`

Open: http://localhost:3000

Environment:
- Leave `NEXT_PUBLIC_API_BASE_URL` unset to use the built-in Next.js proxy (`/api`) and avoid CORS.
- `API_PROXY_TARGET` (default `http://localhost:8080`) controls where the proxy forwards.
- Or set `NEXT_PUBLIC_API_BASE_URL` directly to your backend URL if CORS is enabled.
