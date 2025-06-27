FROM node:lts-alpine3.22

COPY . /app
WORKDIR /app

RUN npm install

ENV MONGO_URI=mongodb://admin:password@localhost:1445/
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV PORT=1444

ENV BACKEND_HOST=localhost
ENV BACKEND_PORT=1444

ENV FRONTEND_HOST=localhost
ENV FRONTEND_PORT=1443

RUN rm -rf node_modules/@inrupt && cp -r /app/@inrupt node_modules/@inrupt

CMD ["npm", "start"]