# FROM node:16 as intermediate
FROM node:16

# This should be production
ENV NODE_ENV=development

# Working directory
WORKDIR /app

# add credentials on build
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

# Build private repo
RUN --mount=type=ssh,id=me git clone git@github.com:volatilitygroup/node-volatility-mfiv.git


# Install dependencies
COPY package.json package-lock.json ./
RUN --mount=type=ssh,id=me npm install -g npm@8.4.1
RUN --mount=type=ssh,id=me npm ci --development

# Copy source
COPY . .

# Build and cleanup
RUN npm run build \
 && npm prune

# Start server
CMD ["npm", "run", "start"]
