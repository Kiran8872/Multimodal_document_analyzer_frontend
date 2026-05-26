# Multimodal Document Analyzer Frontend

React/Vite frontend for the Multimodal Document Analyzer project.

## Local Development

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` when the backend is deployed separately:

```bash
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## Build

```bash
npm run build
```

## Vercel Deployment

Set this environment variable in Vercel:

```bash
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
```

The build output directory is `dist`.
