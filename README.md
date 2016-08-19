# Auth

[![Build Status](https://travis-ci.org/hharnisc/auth-service.svg?branch=master)](https://travis-ci.org/hharnisc/auth-service)

A token management service. It is responsible for creating, refreshing and destroying authentication tokens. Expirable/refreshable tokens are generated using JWT and can be passed onto the client.

## Table Of Contents

- [Quickstart](#quickstart)
- [Testing](#testing)
- [Running Locally](#running-locally)
- [Deploy Locally](#deploy-locally)
- [Deploy To Production](#deploy-to-production)
- [API](#api)

## Quickstart

Install [docker beta](https://beta.docker.com/)

Do a local deploy

```sh
./local_deploy.sh
```

## Testing

Install [docker toolbox](https://beta.docker.com/) (for CI tests)

```sh
$ cd service
```

Install dependencies

```sh
$ npm install
```

### CI Tests

```sh
$ npm run test
```

### Run Unit Tests

```sh
$ npm run test:jest
```

### Run Unit Tests (and watch for changes)

```sh
$ npm run test:watch
```

### Run Integration Tests

```sh
$ npm run test:integration
```

## Running Locally

```sh
$ cd service
```

Install dependencies

```sh
$ npm install
```

Start the server

```sh
$ npm start
```

## Deploy Locally

Follow [Quickstart](#quickstart) instructions

### Deploy Locally With Hot Reload

```sh
./local_deploy.sh -d
```

### Deploy Locally And Skip Build Step

```sh
./local_deploy.sh -n
```

### Deploy Locally With Hot Reload And Skip Build Step

```sh
./local_deploy.sh -dn
```

## Deploy To Production

TODO

## API

### GET /health

A health check

#### request

No parameters

#### response

{}

### POST /v1/create

Create a new auth token for a user

#### request

- **userId** - *string* - an existing user id

#### response

- **accessToken** - *string* - expirable token used to authenticate requests
- **refreshToken** - *string* - persistent token used to generate an `accessToken`
- **expireTime** - *unix timestamp* - the time the access token expires

### POST /v1/refresh

Refresh an `accessToken` with the `refreshToken`

#### request

- **userId** - *string* - an existing user id
- **refreshToken** - *string* - persistent token used to generate an `accessToken`

#### response

- **accessToken** - *string* - expirable token used to authenticate requests
- **expireTime** - *unix timestamp* - the time the access token expires

### POST /v1/reject

Delete a `refreshToken` so it cannot refresh an `accessToken`

#### request

- **userId** - *string* - an existing user id
- **refreshToken** - *string* - persistent token used to generate an `accessToken`

#### response

Empty
