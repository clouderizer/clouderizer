if [ "$NODE_ENV" = 'production' ]
then 
  ln -s /var/openfaas/secrets/sails-config-prod /app/console-api/config/env/production.js
else
  ln -s /var/openfaas/secrets/sails-config /app/console-api/config/env/development.js
fi 

node /app/console-api/app.js