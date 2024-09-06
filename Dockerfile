# Base image
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy rest of the application files
COPY . .

# Expose port (e.g., 3000 if your app runs on that port)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
