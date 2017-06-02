#Authentication service
The responsibilities of the authentication service is to coordinate authentication sessions with configured identity providers and to issue JWTs for internal usage. 

The default authenticate strategy is that a users has to have a _GitHub_ account and are a member of the _Qlik-EA_ organisation.

A prerequisite is to have a _Redis_ database available at the host `redis` running on port `6379`.

The following environment variables needs to be entered to this service:
- `GITHUB_CLIENT_ID` - the client secret from the _GitHub_ OAuth application.
- `GITHUB_CLIENT_SECRET` - the client secret from the _GitHub_ OAuth application. 
- `SESSION_COOKIE_NAME` - name of the session cookie.
- `COOKIE_SIGNING` - secret that is used to sign the session cookie.
- `SUCCESS_REDIRECT_URL` - where to redirect the user upon successfull sign in.
- `FAILURE_REDIRECT_URL` - where to redirect the user if authentication fails.

#### /login
Will redirect to `/login/github` for authentication. _GitHub_ is currently the default identity provider.

#### /login/:idp/
If the specified identity provider is registered in the service it will initiate an authentication attempt with that provider.
When the user is authenticated with the identity provider it will redirect to `/login/:idp/callback` where a signed session cookie 
(name of the cookie is specified in `SESSION_COOKIE_NAME` signature secret `COOKIE_SIGNING`) and a JWT will be issused.
The `sessionId` and the `JWT` will be stored in a Redis database. Finally the user will be redirected to the specified `SUCCESS_REDIRECT_URL`

If the IDP responds with an authentication failure a redirect to the specified `FAILURE_REDIRECT_URL` will be issues.
If an error is throw while trying to write `sessionId` or `JWT` to the database the response to the user will be status code 500.

#### /logout
Logout will remove the `sessionId` and the `JWT` from the _Redis_ database and reset the session cookie.
If any error is thrown from the database while removing `sessionId` or `JWT` a status code 500 will be returned.
