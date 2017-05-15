FROM node:7-alpine
RUN mkdir -p /app/qlik/authentication-service
WORKDIR /app/qlik/authentication-service
COPY package.json ./
RUN npm install --quiet
COPY . ./
RUN npm run lint
EXPOSE "3000"
CMD ["npm", "start", "--silent"]
