FROM centos:latest
RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY . .
RUN yum update -y
RUN yum install -y epel-release
RUN yum install -y golang gmp-devel git make
RUN chmod +x buildgeth.sh
RUN ./buildgeth.sh
EXPOSE 8545
CMD geth --networkid 4224 --mine --minerthreads 1 --datadir $(pwd) --nodiscover --rpc --rpcaddr "0.0.0.0" --rpcport "8545" --port "30303" --rpccorsdomain "*" --nat "any" --rpcapi eth,web3,personal,net --unlock 0 --password $(pwd)/pass.txt --allow-insecure-unlock --ipcpath $(pwd)/geth.ipc >> geth.log