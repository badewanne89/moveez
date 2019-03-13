# Temporarily we are not using ARM but deploy the infra via CLI
based on the [phippyandfriends tutorial](https://cloudblogs.microsoft.com/opensource/2018/11/27/tutorial-azure-devops-setup-cicd-pipeline-kubernetes-docker-helm/)

## Resource Group
```
location=westeurope
rg=moveez
az group create -l $location -n $rg
```

## Registry
```
acr=moveez
az acr create -n $acr -g $rg -l $location --sku Basic
```

## AKS (takes about 10mins to perform)
```
name=moveez
az aks create -l $location -n $name -g $rg --generate-ssh-keys -k 1.12.6 -c 1
az aks get-credentials -n $name -g $rg
```

## Setup tiller for Helm
```
kubectl create serviceaccount tiller --namespace kube-system
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
```

## Setup the moveez namespace
```
kubectl create namespace moveez
kubectl create clusterrolebinding default-view --clusterrole=view --serviceaccount=moveez:default
```

## Connect ACR to AKS
```
CLIENT_ID=$(az aks show -g $rg -n $name --query "servicePrincipalProfile.clientId" -o tsv)
ACR_ID=$(az acr show -n $acr -g $rg --query "id" -o tsv)
az role assignment create --assignee $CLIENT_ID --role acrpull --scope $ACR_ID
registryPassword=$(az ad sp create-for-rbac -n $acr-push --scopes $ACR_ID --role acrpush --query password -o tsv)
echo $registryPassword
```