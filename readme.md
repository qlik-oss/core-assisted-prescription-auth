# Authentication service

**NOTE: This repository contains an example service for the [Qliktive Assisted Prescription](https://github.com/qlik-ea/qliktive-custom-analytics) use case.**

## Status

[![CircleCI](https://circleci.com/gh/qlik-ea/qliktive-authentication-service.svg?style=shield&circle-token=6cd7962488daa4db8b321d381054d2eb72f77668)](https://circleci.com/gh/qlik-ea/qliktive-authentication-service)

## Overview

The responsibilities of the authentication service is to coordinate authentication sessions with configured identity providers and to issue JWTs for internal usage.

The authenticate strategy we are using is that a users has to have a _GitHub_ account and are a member of the _Qlik-EA_ organisation.

A prerequisite is to have a _Redis_ database available at the host specfied in `REDIS_HOST` running on port `REDIS_PORT`.
This database needs to be the same that is used in the gateway to map a session cookie to a JWT.

The following environment variables needs to be entered to this service:

- `GITHUB_CLIENT_ID` - the client secret from the _GitHub_ OAuth application.
- `GITHUB_CLIENT_SECRET` - the client secret from the _GitHub_ OAuth application.
- `SESSION_COOKIE_NAME` - name of the session cookie.
- `COOKIE_SIGNING` - secret that is used to sign the session cookie.
- `SUCCESS_REDIRECT_URL` - where to redirect the user upon successfull sign in.
- `FAILURE_REDIRECT_URL` - where to redirect the user if authentication fails.-
- `REDIS_HOST` - the host adress to the Redis database.
- `REDIS_PORT` - the port on which the Redis database is listening

## Endpoints

Default port used by the qliktive-authentication-service is `3000`.

### /login/:idp/

If the specified identity provider is registered in the service it will initiate an authentication attempt with that provider.
When the user is authenticated with the identity provider it will redirect to `/login/:idp/callback` where a signed session cookie
(name of the cookie is specified in `SESSION_COOKIE_NAME` and the secret used for signing is defined in `COOKIE_SIGNING`) and a JWT will be issused.
The `sessionId` and the `JWT` will be stored in a Redis database. Finally the user will be redirected to the specified `SUCCESS_REDIRECT_URL`

If the IDP responds with an authentication failure a redirect to the specified `FAILURE_REDIRECT_URL` will be issues.
If an error is thrown while trying to write `sessionId` or `JWT` to the database the response to the user will be status code 500.

### /logout

Logout will remove the `sessionId` and the `JWT` from the _Redis_ database and reset the session cookie.
If any error is thrown from the database while removing `sessionId` or `JWT` a status code 500 will be returned.

## Circle CI

Circle CI is configured to build a new Docker image from all pushed commits on all branches of qliktive-authentication-service. As part of this, the built Docker image is pushed to Docker Hub. If pushing to a feature branch (different from `master`), the Docker image is tagged with `<version>-<build-number>`, where `<version>` is fetched from [`package.json`](./package.json), and `<build-number>` is the automatically increased Circle CI build number given to each build. If pushing to `master` the image is also tagged with `latest`.

Linting of the code and some basic smoke testing is part of the job pipeline and must succeed for the docker image to be published.

## Contributing

We welcome and encourage contributions! Please read [Open Source at Qlik R&D](https://github.com/qlik-oss/open-source) for more info on how to get involved.
