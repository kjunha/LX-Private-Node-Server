FROM centos:latest
RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY . .
RUN chmod +x buildgeth.sh
RUN ./buildgeth.sh
EXPOSE 7545