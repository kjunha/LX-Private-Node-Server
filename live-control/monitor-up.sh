cd ..
cp .env ./monitor/monitor-api/.env
cp .env ./monitor/explorer/.env
cd monitor
node ./monitor-api/config-gen.js
docker build -t lx-live-monitor .
docker run -dp 3000:3000 -p 3001:3001 --name live-monitor lx-live-monitor