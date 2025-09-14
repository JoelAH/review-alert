FROM public.ecr.aws/lambda/nodejs:20

# Copy package files first
COPY package.json package-lock.json* ./

# Install dependencies (this compiles native modules for the Lambda environment)
RUN npm ci --only=production

# Copy the rest of your code
COPY . .

# Lambda handler entry point
CMD ["node", "app.js"]