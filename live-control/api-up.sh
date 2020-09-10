cd ..
docker build -t lx-live-api .
docker run -dp 80:8080 --name live-api lx-live-api