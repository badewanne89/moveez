# Networking
To enable external connectivity, we need a domain, an inbound loadbalancer and TLS (https) encryption.
This instruction set is based on an [azure online guide](https://docs.microsoft.com/de-de/azure/aks/ingress-tls). The custom domain part is taken from this nice [guide](https://github.com/fbeltrao/aks-letsencrypt).

## Ingress (External Inbound Loadbalancer)
An ingress controller is a piece of software that provides reverse proxy, configurable traffic routing, and TLS termination for Kubernetes services. Kubernetes ingress resources are used to configure the ingress rules and routes for individual Kubernetes services. Using an ingress controller and ingress rules, a single IP address can be used to route traffic to multiple services in a Kubernetes cluster.

The ingress controller Is basicly a NGINX serving as a reverse proxy. Install it via:
```
helm install stable/nginx-ingress --namespace kube-system --set controller.replicaCount=2
```
Get its public IP for the next step:
```
kubectl get svc -w
```
## DNS
### Associate a cluster-DNS (optional)
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

### Add domain to Azure DNS
Now we let Azure DNS manage our DNSing. Therefore we create an Azure DNS service and change the NX records of our domain to Azure's as described [here](http://www.reimling.eu/2018/01/einrichtung-und-konfiguration-von-azure-dns/).

### Deploy ingress for www.moveez.de
To activate www.moveez.de we need to deploy a special ingress. Use the ingress.yaml within this folder and apply it with `kubectl apply -f ingress.yaml`

### Add A records to DNS pointing to the Ingress Controller's public IP
In your Azure DNS click "+ record set" and type in `www` with a TTL of 1 hour. Do the same again but without the `www`for the `apex` (or root or naked domain entry).

### Add a CAA record for better TLS rating
Add a CAA record to define which CAs can issue TLS for the domain. Use this command:
```
az network dns record-set caa add-record -g moveez -z moveez.de -n "*" --flags 0 --tag "issue" --value "letsencrypt.org"
```

## TLS
The goal of this step is to have a cluster-wide wildcard certificate serving *.moovez.de. We leverage Let's Encrypt to perform TLS termination in the ingress controller.

The key component here is cert-manager that does automatically provisioning of TLS certificates in Kubernetes. Underneath the hood it does the required work to adquire certificates from Let's Encrypt. For wildcard certificates we rely on DNS-01 validation.

Let's Encrypt has a production and a staging environment. Staging provides a fake certificates, but has a high rate limit. Production produces a valid certificate, but has rate limits. For testing purposes use the staging environment, otherwise rate limits might be reached, preventing the creation of new certificates.

### Install cert-manager
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

### Add the service principal as contributor of your DNS Zone for cert-manager
Cert-Manager needs to access the DNS-Zone for the DNS-01 challenge.

```
#Get your service principal clientID
az aks list --query "[].{ name: name, servicePrincipalProfile: servicePrincipalProfile }"

# Find out resource group of the DNS Zone
az network dns zone list --query "[].{ id: id, name: name}"

# Add the service principal as contributor
az role assignment create --assignee <service principal> --role Contributor --scope <dns-zone-id>

## Create secret containing the service principal password
# get the password in base64
echo <the-password> | openssl base64
<the-password-in-base64>

# add the base64 encoded password to the secret.yml and create the secret in Kubernetes - must be in cert-manager namespace!
kubectl create --namespace=cert-manager -f secret.yml
```

### Deploy wildcard cluster issuer
Amost done, now we need to set up a cluster-issuer that listens for new certificate objects and creates orders for the cert-manager to create new valid certificates.
```
kubectl create -f cluster-issuer.yml
```

### Create the wildcard certifacte request for *.moovez.de
```
kubectl create -f certificate.yml
```