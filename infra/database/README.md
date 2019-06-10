# Database
In general we are using `MongoDB` as a database, because we hate `SQL` :)

## DEV/TEST
For our dev and test environments we use [mlab.com](https://mlab.com) and their sandbox environments. The configuration can be seen in `services/gui/config/default.json` (for DEV) or `test.json` (for TEST).

## UAT/PROD
We used to rely on Azures `CosmosDB` but the pricing failed us, therefore we've switched to a local `MongoDB` on `AKS`. To set it up we use the [Bitnami](https://github.com/helm/charts/tree/master/stable/mongodb) image and `helm` with the parameters defined in `values-production.yaml`:

### UAT
The database is deployed like that:
```
helm install --name mongodb-moveez-uat -f ./values-production.yaml \
    --set mongodbRootPassword=uat,mongodbUsername=uat,mongodbPassword=uat,mongodbDatabase=uat \
    stable/mongodb
```

### PROD
With the initial deployment a `mongodbRootPassword` is defined and stored within `schdief`s iCloud Keychain as `moveez_prod_db_admin`. The other keys are stored within Kubernetes as a secret called `moveez-prod-db`, defined within `moveez-prod-db-secret.yaml` and deployed with:
```
kubectl apply -f moveez-prod-db-secret.yaml
```

The database is deployed just like the `UAT` environment:
```
helm install --name mongodb-moveez-prod -f ./values-production.yaml \
    --set mongodbRootPassword=SECRET,mongodbUsername=SECRET,mongodbPassword=SECRET,mongodbDatabase=prod \
    stable/mongodb
```

## Management
To access our databases we use an extra `MongoDB`. To connect to the production database follow these steps:
```
# start mongodb client
kubectl run mongoclient --image=mongo
# connect to its terminal via kubernetes VScode integration
# connect to the database (use real name instead of USER)
mongo "mongodb://USER@mongodb-moveez-prod:27017/prod"
# type in the password
# to list the content of the title collection for example, just type
db.titles.find()
```

Here you can find the [MongoDB Shell command reference](https://docs.mongodb.com/manual/reference/mongo-shell/).

In future we might use [NoSQLClient](https://www.nosqlclient.com). It could be accessable via `nosqlclient.moveez.de` and deployed with the ingress, service and deployment yamls defined in this folder. But it doesn't really work right now.