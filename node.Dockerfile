# Use Node to build application
FROM node:12-alpine as angular

# Set maintainer.
LABEL maintainer="Intermx"

# Set Working Directory
WORKDIR /usr/src/app

# Run npm with full permission
RUN npm config set unsafe-perm true

# Add AWS with Credentials
RUN apk add --no-cache \
        python3 \
        py3-pip \
    && pip3 install --upgrade pip \
    && pip3 install \
        awscli \
    && rm -rf /var/cache/apk/*

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_REGION=us-east-1

# Clean cache
RUN npm cache clean --force
RUN npm update

# Run npm with full permission
RUN npm install -g @angular/cli

# No cache
RUN apk add --no-cache git

# Copy package.json
COPY package*.json ./

# Use for custom Node package install
RUN npm run aws-npm:login

# Copy build-scripts Directory for node post build
COPY build-scripts/* /usr/src/app/build-scripts/

# Run npm continuous integration with full permission
RUN npm ci

COPY . .

# Build as prod
RUN node --max_old_space_size=4096 node_modules/@angular/cli/bin/ng build --prod

# Use node image to build nodejs express application
FROM node:11-alpine

# Switch to app folder
WORKDIR /usr/src/app

# Copy everything into the new container
COPY . .

# Set the work directory to travis to use the nodejs server
WORKDIR /usr/src/app/node-api

# Install dependencies from package.json
RUN npm install

# Copy in compiled angular application
COPY --from=angular /usr/src/app/dist dist/

# Open port 3000
EXPOSE 3000

# Run node application
CMD ["node", "./bin/www"]
