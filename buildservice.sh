yum install -y epel-release
yum install -y golang gmp-devel git make nodejs python3
git clone https://github.com/ethereum/go-ethereum
cd go-ethereum
make all
cp build/bin/geth /usr/local/bin
cp build/bin/bootnode /usr/local/bin
cd ..
npm i -g  --unsafe-perm=true --allow-root truffle
npm i -g forever
geth --datadir . init genesis.json
geth account new --password pass.txt --datadir .
geth --networkid 4224 --mine --minerthreads 1 --datadir $(pwd) --nodiscover --rpc --rpcaddr "0.0.0.0" --rpcport "7545" --port "30303" --rpccorsdomain "*" --nat "any" --rpcapi eth,web3,personal,net --unlock 0 --password $(pwd)/pass.txt --allow-insecure-unlock --ipcpath $(pwd)/geth.ipc >> geth.log &!
echo 'Build Service Complete'