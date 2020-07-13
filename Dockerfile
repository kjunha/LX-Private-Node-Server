FROM centos:latest
RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY buildservice.sh .
RUN chmod +x buildservice.sh
RUN ./buildservice.sh
COPY . .
RUN npm install
RUN truffle migrate
EXPOSE 8080
CMD ["forever", "app.js"]