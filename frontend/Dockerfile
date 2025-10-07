FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Allow passing backend URLs as build args that map to Vite vars
ARG VITE_ISSUANCE_URL
ARG VITE_VERIFY_URL
ENV VITE_ISSUANCE_URL=${VITE_ISSUANCE_URL}
ENV VITE_VERIFY_URL=${VITE_VERIFY_URL}

RUN npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

