FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install || true

COPY . .

CMD ["npm", "start"]