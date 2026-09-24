FROM node:22-alpine

# Install git since Baileys dependency is installed directly from GitHub
RUN apk add --no-cache git openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Compile TypeScript
RUN npm run build

EXPOSE 8024

CMD ["npm", "start"]