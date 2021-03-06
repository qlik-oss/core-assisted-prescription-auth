# Authentication service

# This project has been deprecated
The project will be kept here for reference only. The repo will not be continuously updated and supported. 

**NOTE: This repository contains an example service for the [Qlik Core Assisted Prescription](https://github.com/qlik-oss/core-assisted-prescription) use case.**

## Status

[![CircleCI](https://circleci.com/gh/qlik-oss/core-assisted-prescription-auth.svg?style=shield)](https://circleci.com/gh/qlik-oss/core-assisted-prescription-auth)

## Overview

The responsibilities of the authentication service are to coordinate authentication sessions with configured identity providers and to issue JWTs for internal usage.

The authentication service currently supports two authentication methods, `local` and `github`. 

If you choose to use `github` as authentication method you can specify one or more Github organization separated with `;` in the environment variables `GITHUB_ORG_IS_ADMIN`. This will give the users who are a member admin priveledges. If no organization is specified all users will gain admin rights. 

A prerequisite is to have a _Redis_ database available at the host specified in `REDIS_HOST` running on port `REDIS_PORT`.
This database needs to be the same that is used in the gateway to map a session cookie to a JWT.

The following environment variables need to be entered into this service:

- `GITHUB_CLIENT_ID` - the client secret from the _GitHub_ OAuth application.
- `GITHUB_CLIENT_SECRET` - the client secret from the _GitHub_ OAuth application.
- `GITHUB_ORG_IS_ADMIN`- the Github organization that will grant admin privileges.
- `SESSION_COOKIE_NAME` - name of the session cookie.
- `COOKIE_SIGNING` - secret that is used to sign the session cookie.
- `SUCCESS_REDIRECT_URL` - where to redirect the user upon successful sign in.
- `FAILURE_REDIRECT_URL` - where to redirect the user if authentication fails.-
- `REDIS_HOST` - the host address to the Redis database.
- `REDIS_PORT` - the port on which the Redis database is listening.
- `AUTH_STRATEGY`- the authentication strategy used. 

## Endpoints

The default port used by the core-assisted-prescription-auth is `3000`.

### /login/:idp/

If the specified identity provider is registered in the service it will initiate an authentication attempt with that provider.
When the user is authenticated with the identity provider it will redirect to `/login/:idp/callback` where a signed session cookie
(name of the cookie is specified in `SESSION_COOKIE_NAME` and the secret used for signing is defined in `COOKIE_SIGNING`) and a JWT will be issued.
The `sessionId` and the `JWT` will be stored in a Redis database. Finally, the user will be redirected to the specified `SUCCESS_REDIRECT_URL`

If the IDP responds with an authentication failure a redirect to the specified `FAILURE_REDIRECT_URL` will be issued.
If an error is thrown while trying to write `sessionId` or `JWT` to the database the response to the user will be status code 500.

### /logout

Logout will remove the `sessionId` and the `JWT` from the _Redis_ database and reset the session cookie.
If any error is thrown from the database while removing `sessionId` or `JWT` a status code 500 will be returned.

## Circle CI

Circle CI is configured to build a new Docker image from all pushed commits on all branches of core-assisted-prescription-auth. As part of this, the built Docker image is pushed to Docker Hub. If pushing to a feature branch (different from `master`), the Docker image is tagged with `<version>-<build-number>`, where `<version>` is fetched from [`package.json`](./package.json), and `<build-number>` is the automatically increased Circle CI build number given to each build. If pushing to `master` the image is also tagged with `latest`.

Linting of the code and some basic smoke testing is part of the job pipeline and must succeed for the docker image to be published.

## Contributing

We welcome and encourage contributions! Please read [Open Source at Qlik R&D](https://github.com/qlik-oss/open-source) for more info on how to get involved.
