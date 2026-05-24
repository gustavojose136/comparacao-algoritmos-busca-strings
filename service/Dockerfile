FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY test ./test

EXPOSE 3000
CMD ["npm", "start"]
