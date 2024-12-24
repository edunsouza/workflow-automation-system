cd $(dirname $0) # current directory

docker volume prune
docker-compose -f ./docker-compose.yaml up