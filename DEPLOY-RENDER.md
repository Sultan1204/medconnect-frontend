# Temporary deployment on Render (frontend)

1. Deploy the **backend** first and copy its URL.
2. Render → New → **Blueprint** → pick this repo. Set `VITE_API_BASE_URL` to the backend URL (no trailing slash).
3. After the frontend is live, set the backend's `CORS_ALLOWED_ORIGINS` to the frontend URL and redeploy the backend.

`VITE_API_BASE_URL` is baked in at build time - changing it needs a rebuild. For a no-backend preview set `VITE_API_MODE=mock`.
Demo logins and OTP codes: see the backend's `DEPLOY-RENDER.md`.
