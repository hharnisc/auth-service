FROM mhart/alpine-node

RUN mkdir -p /service
WORKDIR /service
COPY service/package.json /service/
COPY service/.babelrc /service/

RUN npm install

COPY service/src/ /service/src/

RUN npm run build
