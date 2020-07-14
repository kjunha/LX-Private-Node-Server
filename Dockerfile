FROM node:alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install -g  --unsafe-perm=true --allow-root truffle
COPY . .
RUN chmod +x initserver.sh
EXPOSE 8080
CMD ./initserver.sh