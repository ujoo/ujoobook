# Base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# No cache를 사용하고 싶다면 node_modules 삭제 후 설치
RUN npm ci --no-cache

# Copy rest of the application files
COPY . .

# Expose port (e.g., 3000 if your app runs on that port)
EXPOSE 3000

## Start the application
CMD ["npm", "start"]