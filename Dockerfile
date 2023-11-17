FROM node:lts

RUN apt-get update && apt-get install -y tzdata

ENV TZ=Asia/Makassar

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]
