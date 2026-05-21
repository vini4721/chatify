# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/Frontend
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci
COPY Frontend/ ./
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM node:20-bookworm-slim AS production
WORKDIR /app/Backend
ENV NODE_ENV=production
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --omit=dev
COPY Backend/ ./
COPY --from=frontend-build /app/Frontend/dist /app/Frontend/dist
RUN chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
