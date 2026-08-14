FROM node:24-alpine AS build-env
COPY . /app
WORKDIR /app
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=build-env /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
