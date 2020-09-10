# Setup and start eth-netstats
cd netstats
npm install
grunt
export WS_SECRET=lx
pm2 start npm --name netstats -- start
cd ..

#Setup and start monitoring api server
cd monitor-api
npm install
pm2 start app.json
cd ..

#Setup and start explorer
cd explorer
npm install
pm2 start npm --name explorer -- start
cd ..

pm2 logs --lines 50