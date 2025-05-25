# Use the official Node.js image as the base image
FROM node:latest

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the NestJS application

ARG DATABASE_URL



RUN npm run build

ENV NODE_ENV=production

RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npx prisma db seed



# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/src/main"]