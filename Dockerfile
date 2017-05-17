FROM node:7-alpine
RUN mkdir -p /app/qlik/authentication-service
WORKDIR /app/qlik/authentication-service
COPY package.json ./
RUN npm install --production --quiet
COPY . ./
EXPOSE "3000"
ENTRYPOINT ["npm", "start", "--silent"]
