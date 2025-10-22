FROM node:alpine3.23

WORKDIR /frontend

COPY package*.json ./

RUN npm install

COPY . . 

CMD ["npm", "start"]