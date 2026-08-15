FROM node:24.16.0-alpine3.24 AS runtime-deps
LABEL maintainer=developers@kloding.com

# Update packages.
RUN apk upgrade --no-cache && apk add --no-cache ffmpeg

# Create app directory
WORKDIR /opt/mybandnow

# Copy application bundle
COPY docs ./
ADD dist ./

# Install mybandnow API dependencies
RUN npm ci --omit=dev --ignore-scripts

FROM node:24.16.0-alpine3.24
LABEL maintainer=developers@kloding.com

RUN apk upgrade --no-cache && apk add --no-cache ffmpeg

WORKDIR /opt/mybandnow

COPY --from=runtime-deps /opt/mybandnow ./

# Start API
CMD [ "node", "start.js" ]
