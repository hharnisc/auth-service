# Auth

Note: This is the node module the get's packaged as the service.

A token management service. It is responsible for creating, refreshing and destroying authentication tokens. Expirable/refreshable tokens are generated using JTW and can be passed onto the client.

## Run

```sh
$ npm install
$ npm start
```

## Tests

Run **integration** and **unit tests**

Install [docker toolbox](https://www.docker.com/products/docker-toolbox)

```sh
$ npm install
$ npm test
```

## Unit Test

Just run the unit tests

```sh
$ npm install
$ npm run test:jest
```

Or to start unit tests that watch for changes

```sh
$ npm install
$ npm run test:watch
```
