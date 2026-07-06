# Despliegue frontend en EasyPanel

El frontend se despliega como una aplicacion Node SSR de TanStack Start.

## Docker

EasyPanel debe usar:

- `Dockerfile`: `Dockerfile`
- Puerto interno: `3000`
- Healthcheck path: `/health`

## Variables

`VITE_API_BASE_URL` se inyecta en build time, no en runtime.

Si backend y frontend comparten dominio mediante proxy `/api`, no configures nada:

```txt
VITE_API_BASE_URL=/api
```

Si el backend vive en otro dominio, configura build arg en EasyPanel:

```txt
VITE_API_BASE_URL=https://api.tu-dominio.com/api
```

## Build local

```bash
docker build -t leo-graphycs-frontend .
docker run --rm -p 3000:3000 leo-graphycs-frontend
```

## Verificacion

```bash
curl http://localhost:3000/health
```

