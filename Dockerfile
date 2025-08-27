# Use a slim Node.js image as the builder stage
FROM node:20-bullseye AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's layer caching
# This step only runs if package files change, making subsequent builds faster
COPY package.json package-lock.json ./

# Setup npm retry and timeout for better network resilience.
# This helps prevent build failures on flaky networks.
RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-factor 10 && \
    npm config set fetch-retry-mintimeout 1000 && \
    npm config set fetch-retry-maxtimeout 120000

# Install dependencies cleanly inside Docker.
# We've removed --prefer-offline to ensure a clean download from the registry.
# The .dockerignore file ensures that the host's node_modules is not copied.
RUN npm ci --no-audit --progress=false

# Copy the rest of the source code
COPY . .

# Build the Next.js production app
# This generates the optimized code in the .next directory
RUN npm run build

# --- Production image (The final, smaller image to run the app) ---
FROM node:20-bullseye AS runner

# Set the working directory
WORKDIR /app

# Set environment variable for production
ENV NODE_ENV=production

# Copy necessary files from the builder stage
# This keeps the final image small by not including dev dependencies
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port the app runs on
EXPOSE 3000

# Start the Next.js app
CMD ["npm", "start"]