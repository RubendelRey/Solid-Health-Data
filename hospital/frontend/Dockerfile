FROM node:lts-alpine3.22
COPY . /app
WORKDIR /app

ENV API_HOST=localhost
ENV API_PORT=2444

RUN npm install

CMD ["npm", "run", "dev"]