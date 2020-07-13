FROM centos:latest
RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY buildservice.sh .
COPY genesis.json .
COPY pass.txt .
RUN chmod +x buildservice.sh
RUN ./buildservice.sh
ADD . .
RUN npm install
RUN truffle migrate
EXPOSE 8080
CMD ["npm", "start"]