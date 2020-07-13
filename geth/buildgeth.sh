yum update -y
yum install -y epel-release
yum install -y golang gmp-devel git make
git clone https://github.com/ethereum/go-ethereum
cd go-ethereum
make all
cp build/bin/geth /usr/local/bin
cp build/bin/bootnode /usr/local/bin
cd ..
geth --datadir . init genesis.json
geth account new --password pass.txt --datadir .
