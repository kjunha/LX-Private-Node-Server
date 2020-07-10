yum install -y epel-release
yum install -y golang gmp-devel git make nodejs
git clone https://github.com/ethereum/go-ethereum
cd go-ethereum
make all
cp build/bin/geth /usr/local/bin
cp build/bin/bootnode /usr/local/bin
cd ..
npm i -g  --unsafe-perm=true --allow-root truffle
geth --datadir . init genesis.json
# geth account new --password <(echo 0000)
# geth --networkid 4224 --mine --minerthreads 1 --datadir $(pwd) --nodiscover --rpc --rpcport "7545" --port "30303" --rpccorsdomain "*" --nat "any" --rpcapi eth,web3,personal,net --unlock 0 --password $(pwd)/pass.txt --allow-insecure-unlock --ipcpath $(pwd)/geth.ipc