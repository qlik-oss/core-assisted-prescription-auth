FROM node:7-alpine
RUN apk add --update bash && rm -rf /var/cache/apk/*
RUN mkdir -p /app/qlik/authentication-service
WORKDIR /app/qlik/authentication-service
COPY package.json ./
RUN npm install --production --quiet
COPY . ./
EXPOSE "3000"
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start", "--silent"]