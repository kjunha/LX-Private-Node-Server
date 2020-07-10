FROM centos:latest
RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY buildservice.sh .
COPY genesis.json .
RUN chmod +x buildservice.sh
RUN ./buildservice.sh