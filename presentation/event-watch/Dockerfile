FROM node:alpine
WORKDIR /usr/src/app
RUN apk update
RUN apk add git
COPY . .
RUN npm install && npm install -g serve
RUN npm run build
EXPOSE 5000
CMD serve -s build
