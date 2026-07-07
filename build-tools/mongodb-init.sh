#!/bin/bash
set -e;

# a default non-root role
MONGO_INITDB_ROLE="${MONGO_INITDB_ROLE:-readWrite}"

if [ -n "${MONGO_INITDB_USERNAME:-}" ] && [ -n "${MONGO_INITDB_PASSWORD:-}" ]; then
	"${mongo[@]}" "$MONGO_INITDB_DATABASE" <<-EOJS
		try { rs.status().ok } catch(e) { rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]}) }
		
		var maxAttempts = 30;
		while (!db.hello().isWritablePrimary && maxAttempts > 0) {
			sleep(1000);
			maxAttempts--;
		}

		db.createUser({
			user: $(_js_escape "$MONGO_INITDB_USERNAME"),
			pwd: $(_js_escape "$MONGO_INITDB_PASSWORD"),
			roles: [ { role: $(_js_escape "$MONGO_INITDB_ROLE"), db: $(_js_escape "$MONGO_INITDB_DATABASE") } ]
		});

	EOJS
else
	# print warning or kill temporary mongo and exit non-zero
    echo "ERROR: Could not create initial database"
fi
