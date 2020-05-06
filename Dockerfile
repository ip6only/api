FROM node:12

WORKDIR /usr/src/app

# install dependencies
COPY package*.json ./

RUN npm install

# bundle source
COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]
