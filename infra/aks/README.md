# Azure Kubernetes Service
To run moveez we are using Azure Kubernetes Service. To create a new AKS instance follow this little guide.

## Prerequisits
### Service Principal
You won't be able to perform any steps without a service principal, therefore create one with:
```
az ad sp create-for-rbac --name moveez_sp
```
The result should look something like this:
```
{
  "appId": "***",
  "displayName": "***",
  "name": "http://***",
  "password": "***",
  "tenant": "***"
}
```
> Hint: the `appId` is also known as `clientId` 

More details about service principals can be found [here](https://docs.microsoft.com/de-de/cli/azure/create-an-azure-service-principal-azure-cli?view=azure-cli-latest).

### Resource Group
Next up create a resource group to accomodate your AKS cluster with:
```
az group create --name moveez_aks_rg --location "East US"
```

### Azure Resource Manager Template
Finally you need to create your ARM-template as the Infrastructue-as-Code definition to deploy the AKS via Azure CLI. You can do this by opening portal.azure.com and selecting a new AKS cluster. Configure everything as you need and instead of deploying it via GUI, export the template files. You'll get a selection of different files, but you'll only need the following (as you can see in this folder):
- template.json
- parameters.json
- deploy.sh

Open the parameters.json file and replace the `null` values of `servicePrincipalClientId` and `servicePrincipalClientSecret` with the actual values.
> DANGER: never commit those values to a shared repository, this data is sensitive and grants permission to your whole azure subscription! So threat them like your own credentials and keep them to you.

## Deployment
After taking care of the prerequisits you can now deploy your new AKS by simply running this command:
```
az group deployment create --name moveez_aks --resource-group moveez_aks_rg --template-file template.json --parameters parameters.json
```
> Hint: this might tike a while (several minutes)
Azure CLI will overload you with a huge json response when it is done.

You can check the success of your deployment either in the portal or with:
```
az group deployment list --resource-group moveez_aks_rg
```

More details about the deployment and prerequisits can be found [here](https://docs.microsoft.com/de-de/azure/azure-resource-manager/resource-group-template-deploy-cli).

## Ingress
An ingress controller is a piece of software that provides reverse proxy, configurable traffic routing, and TLS termination for Kubernetes services. Kubernetes ingress resources are used to configure the ingress rules and routes for individual Kubernetes services. Using an ingress controller and ingress rules, a single IP address can be used to route traffic to multiple services in a Kubernetes cluster.

This instruction set is based on an [azure online guide](https://docs.microsoft.com/de-de/azure/aks/ingress-tls). The custom domain part is taken from this nice [guide](https://github.com/fbeltrao/aks-letsencrypt).

### Ingress Controller
Is basicly a NGINX serving as a reverse proxy. Install it via:
```
helm install stable/nginx-ingress --namespace kube-system --set controller.replicaCount=2
```
Get its public IP for the next step:
```
kubectl get svc -w
```

### DNS
#### Associate a cluster-DNS (optional)
Define a DNS name for the newly created public IP:
```
#!/bin/bash

# Public IP address of your ingress controller
IP="13.94.175.11"

# Name to associate with public IP address
DNSNAME="moveez"

# Get the resource-id of the public ip
PUBLICIPID=$(az network public-ip list --query "[?ipAddress!=null]|[?contains(ipAddress, '$IP')].[id]" --output tsv)

# Update public ip address with DNS name
az network public-ip update --ids $PUBLICIPID --dns-name $DNSNAME
```

#### Add domain to Azure DNS
Now we let Azure DNS manage our DNSing. Therefore we create an Azure DNS service and change the NX records of our domain to Azure's as described [here](http://www.reimling.eu/2018/01/einrichtung-und-konfiguration-von-azure-dns/).

#### Deploy ingress for www.moveez.de
To activate www.moveez.de we need to deploy a special ingress. Use the ingress.yaml within this folder and apply it with `kubectl apply -f ingress.yaml`

#### Add an A record to DNS pointing to the Ingress Controller's public IP
In your Azure DNS click "+ record set" and type in `www` with a TTL of 1 hour.

### TLS
The goal of this step is leverage Let's Encrypt to perform TLS termination in the ingress controller.

The key component here is cert-manager that does automatically provision of TLS certificates in Kubernetes. Underneath the hood it does the required work to adquire certificates from Let's Encrypt. This example will rely on http validation.

Let's Encrypt has a production and a staging environment. Staging provides a fake certificates, but has a high rate limit. Production produces a valid certificate, but has rate limits. For testing purposes use the staging environment, otherwise rate limits might be reached, preventing the creation of new certificates.

#### Install cert-manager
The NGINX ingress controller supports TLS termination. There are several ways to retrieve and configure certificates for HTTPS. This article demonstrates using cert-manager, which provides automatic Lets Encrypt certificate generation and management functionality.

```
## IMPORTANT: you MUST install the cert-manager CRDs **before** installing the cert-manager Helm chart
kubectl apply -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.7/deploy/manifests/00-crds.yaml

# Create the namespace for cert-manager
kubectl create namespace cert-manager

## IMPORTANT: if the cert-manager namespace **already exists**, you MUST ensure
## it has an additional label on it in order for the deployment to succeed
kubectl label namespace cert-manager certmanager.k8s.io/disable-validation="true"

# Add the Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io

# Update your local Helm chart repository cache
helm repo update

# Install the cert-manager Helm chart
helm install --name cert-manager --namespace cert-manager --version v0.7.0 jetstack/cert-manager
```

#### Setup wildcard certificates with Azure DNS Validation
The goal of this step is to handle TLS with a wildcard, so that a single certificate can handle multiple sub-domains.

##### Add the service principal as contributor of your DNS Zone
```
#Get your service principal clientID
az aks list --query "[].{ name: name, servicePrincipalProfile: servicePrincipalProfile }"

# Find out resource group of the DNS Zone
az network dns zone list --query "[].{ id: id, name: name}"

# Add the service principal as contributor
az role assignment create --assignee <service principal> --role Contributor --scope <dns-zone-id>
```

##### Create secret containing the service principal password
```
# get the password in base64
echo <the-password> | openssl base64
<the-password-in-base64>

#Create the secret in Kubernetes with `kubectl create -f secret.yml`

##### Deploy wildcard cluster issuer

`kubectl create -f cluster-issuer.yml`

##### Deploy certificate

`kubectl create -f certificate.yml`