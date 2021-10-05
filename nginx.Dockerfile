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

# Set environment variable for Chromium
ENV CHROME_BIN=/usr/bin/chromium-browser

# Get Chromium to run Unit test
RUN apk update && apk upgrade && \
    apk add --no-cache \
    chromium

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

# Copy in the rest of the files
COPY . .

# Run Unit test using Headlass Chrome
# RUN ng test --watch=false --karma-config karma.test.conf.js

# Remove Chromium after Unit test
RUN apk del --no-cache chromium

# Build as prod
RUN node --max_old_space_size=4096 node_modules/@angular/cli/bin/ng build --prod

# Use Nginx for proxy
FROM nginx:stable-alpine

# Copy nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Copy in compiled build from angular stage
COPY --from=angular /usr/src/app/dist /usr/share/nginx/html

# Use PORT 80
EXPOSE 80

# Run NGINX
CMD ["nginx", "-g", "daemon off;"]
