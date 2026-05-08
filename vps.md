cd /opt/sigmaconnect/bniconnect


cd /opt/sigmaconnect/bniconnect && git pull && docker compose up -d --build

docker compose logs backend
docker compose logs frontend