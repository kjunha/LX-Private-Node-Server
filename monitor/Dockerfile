FROM node:alpine
WORKDIR /usr/src/app
RUN apk update
RUN apk add git
RUN npm install -g --unsafe-perm=true --allow-root pm2 grunt
COPY . .
RUN chmod +x buildmonitor.sh
EXPOSE 3000 3001
CMD ./buildmonitor.sh