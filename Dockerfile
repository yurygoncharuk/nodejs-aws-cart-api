# Dependencies stage
FROM node:20-alpine AS dependencies
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Build stage
FROM dependencies AS build
WORKDIR /usr/src/app
COPY . .
RUN npm run build:image

# Final stage
FROM node:20-alpine
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/main"]