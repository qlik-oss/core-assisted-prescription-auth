FROM node:8-alpine

RUN apk update && apk add bash && rm -rf /var/cache/apk/*
RUN mkdir -p /app/qlik/authentication-service

WORKDIR /app/qlik/authentication-service

COPY docker-entrypoint.sh ./
COPY package.json ./
RUN npm install --production --quiet

COPY src src/

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start", "--silent"]