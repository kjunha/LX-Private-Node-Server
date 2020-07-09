FROM node:alpine
WORKDIR /usr/src/app
RUN npm install -g ganache-cli
RUN npm install -g truffle
RUN ganache-cli -h 0.0.0.0 -p 7545
COPY package*.json ./
RUN npm install
RUN truffle migrate
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
