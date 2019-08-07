# Database
In general we are using `MongoDB` as a database, because we hate `SQL` :)

## DEV/TEST
For our dev and test environments we use [mlab.com](https://mlab.com) and their sandbox environments. The configuration can be seen in `services/gui/config/default.json` (for DEV) or `test.json` (for TEST).

## UAT/PROD
We used to rely on Azures `CosmosDB` but the pricing failed us, therefore we've switched to a local `MongoDB` on `AKS`. To set it up we use the [Bitnami](https://github.com/helm/charts/tree/master/stable/mongodb) image and `helm` with the parameters defined in `values-production.yaml`.

The database requires persistance, which is achieved with dynamic presistant volume claims. Hetzner Cloud doesn't provide this out-of-the-box therefore we need to install their [Container Storage Interface driver](https://github.com/hetznercloud/csi-driver) manually:
1. create API token in [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. place the token in `secret.yaml`and create a secret with the token with `kubectl apply -f secret.yaml --namespace kube-system`
3. deploy CSI driver with `kubectl apply -f https://raw.githubusercontent.com/hetznercloud/csi-driver/master/deploy/kubernetes/hcloud-csi.yml`
4. verify the CSI setup with the test PVC and pod `kubectl apply -f pvctest.yaml`
5. once the pod is ready, exec a shell and check that your volume is mounted at /data.
6. delete the test pod and PVC with `kubectl delete pod my-csi-app`

### UAT
For UAT we are not using PVC as the database is not persistant. The database is deployed like that:
```
helm install --name mongodb-moveez-uat -f ./values-uat.yaml \
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