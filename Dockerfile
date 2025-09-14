# Use Node.js 20 LTS
FROM node:20

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python test dependencies
RUN pip3 install pytest selenium

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Upgrade npm to avoid bugs
RUN npm install -g npm@latest

# Install dependencies
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy the rest of the code
COPY . .

# Ensure Prisma uses local binary engine
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"
ENV PRISMA_CLIENT_ENGINE_TYPE=binary

# Generate Prisma client at build time
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
