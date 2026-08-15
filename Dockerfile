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

# --ignore-scripts skips @prisma/client's own postinstall generation step, and
# the Prisma CLI/schema aren't shipped in this image, so we overlay the client
# already generated on the host by `npm run build` (prisma:generate).
COPY node_modules/.prisma ./node_modules/.prisma

FROM node:24.16.0-alpine3.24
LABEL maintainer=developers@kloding.com

RUN apk upgrade --no-cache && apk add --no-cache ffmpeg

WORKDIR /opt/mybandnow

COPY --from=runtime-deps /opt/mybandnow ./

# Start API
CMD [ "node", "start.js" ]
