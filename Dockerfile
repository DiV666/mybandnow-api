FROM node:24.16.0-alpine3.24 AS runtime-deps
LABEL maintainer=developers@kloding.com

# Update packages.
RUN apk upgrade --no-cache && apk add --no-cache ffmpeg

# Create app directory
WORKDIR /opt/mybandnow

# Copy application bundle and private npm configuration for dependency install only
COPY docs ./
ADD dist ./
COPY .npmrc ./.npmrc

# Install mybandnow API dependencies without shipping .npmrc in the final image
RUN npm ci --omit=dev --ignore-scripts && rm -f .npmrc

FROM node:24.16.0-alpine3.24
LABEL maintainer=developers@kloding.com

RUN apk upgrade --no-cache && apk add --no-cache ffmpeg

WORKDIR /opt/mybandnow

COPY --from=runtime-deps /opt/mybandnow ./

# Start API
CMD [ "node", "start.js" ]
