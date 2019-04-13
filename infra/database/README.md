# Database
In general we are using MongoDB as a database, because we hate SQL :)

## DEV and UAT
For our non-productive environments we use [mlab.com](https://mlab.com) and their sandbox environments. The configuration can be seen in `services/gui/config/default.json` (for DEV) or `/uat.json`.

## PROD
In production we use Azures `CosmosDB` because it should be highly reliable, has automatic backups and should be easy to use by having an attractive price point (we'll see about that).

## Configuration
### Create the CosmosDB
Create the CosmosDB via GUI or with the ARM template in this folder.

### Change configuration values
Update the values in `services/gui/config/prod.json` taken from the connection string section so gui knows where to look for the database. Username and password of the production environment are taken from a secret, which we'll deploy next.

### Create a secret with username and password for the database
Create the secret with this command:
````
kubectl create secret generic moveez-prod-db --from-literal=dbuser=secret --from-literal=dbpass=secret
```