#!/usr/bin/env bash
GREEN='\033[0;32m'
NC='\033[0m'
BUILD=true
DEV=false

while getopts 'dn' flag; do
  case "${flag}" in
    n) BUILD=false ;;
    d) DEV=true ;;
    *) ;;
  esac
done

if [ "$DEV" = true ];then
    if [ "$BUILD" = true ];then
      printf "${GREEN}Docker Compose Build (Dev Mode)${NC}\n" && \
      docker-compose -f docker-compose-dev.yml -p localdeploy build && \
      printf "${GREEN}Docker Compose Up (Dev Mode)${NC}\n" && \
      docker-compose -f docker-compose-dev.yml -p localdeploy up
    else
      printf "${GREEN}Docker Compose Up (Dev Mode)${NC}\n" && \
      docker-compose -f docker-compose-dev.yml -p localdeploy up
    fi
else
  if [ "$BUILD" = true ];then
    printf "${GREEN}Docker Compose Build${NC}\n" && \
    docker-compose -p localdeploy build && \
    printf "${GREEN}Docker Compose Up${NC}\n" && \
    docker-compose -p localdeploy up
  else
    printf "${GREEN}Docker Compose Up${NC}\n" && \
    docker-compose -p localdeploy up
  fi
fi

docker-compose -p localdeploy kill
docker-compose -p localdeploy rm -f --all
