FROM node:8-alpine

RUN apk update && apk add bash && apk add curl && rm -rf /var/cache/apk/*
RUN mkdir -p /app/qlik/authentication-service

# check every 30s to ensure this service returns HTTP 200
HEALTHCHECK CMD curl -fs http://localhost:3000/health || exit 1

WORKDIR /app/qlik/authentication-service

COPY docker-entrypoint.sh ./
COPY package.json ./
RUN npm install --production --quiet

COPY src src/

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start", "--silent"]
