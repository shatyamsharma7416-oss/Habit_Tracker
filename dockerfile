FROM node:20-slim

WORKDIR /user/src/app

COPY package.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]