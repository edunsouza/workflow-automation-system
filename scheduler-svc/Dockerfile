FROM node:22-alpine

WORKDIR /app

COPY package*.json /app

RUN npm i

COPY . .

RUN npm run build

EXPOSE 8082

ENV PORT=8082
ENV DATABASE_URL="mongodb://admin:password@host.docker.internal:27017"
ENV KAFKA_URL="host.docker.internal:29092"

CMD [ "npm", "start" ]