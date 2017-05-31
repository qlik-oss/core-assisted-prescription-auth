#!/bin/bash
# usage: file_env VAR [DEFAULT]
#    ie: file_env 'XYZ_DB_PASSWORD' 'example'
# (will allow for "$XYZ_DB_PASSWORD_FILE" to fill in the value of
#  "$XYZ_DB_PASSWORD" from a file, especially for Docker's secrets feature)

file_env() {
	local var="$1"
	local fileVar="${var}_FILE"
	local def="${2:-}"
	local val="$def"

#Defaults to enviroment if set, else to *_FILE enviroment
	if [ "${!var:-}" ]; then
		val="${!var}"
	elif [ "${!fileVar:-}" ]; then
		val="$(< "${!fileVar}")"
	fi
	export "$var"="$val"
	unset "$fileVar"
}

envs=(
		GITHUB_CLIENT_ID
		GITHUB_CLIENT_SECRET
		JWT_SECRET
		COOKIE_SIGNING
)

for e in "${envs[@]}"; do
		file_env "$e"
done

exec "$@"