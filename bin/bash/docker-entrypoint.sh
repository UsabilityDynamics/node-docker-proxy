#!/bin/bash
############################################################
##
## Allows for follow-through of commands.
## sh entrypoint.sh pwd
## will run the entrypoint scripts and then execute "pwd"
##
############################################################

## Run SupervisorD
if [ -f "/etc/supervisor/supervisord.conf" ]; then
  echo Starting Supervisor Service.
  supervisord -c /etc/supervisor/supervisord.conf -u root
else
  echo "- Missing Supervisor configuration file."
fi

## Pipe/Follow-through other commands.
exec "$@"

