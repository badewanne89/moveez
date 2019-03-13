# Azure Kubernetes Service
To run moveez we are using Azure Kubernetes Service. To create a new AKS instance follow this little guide.

# Prerequisits
## Service Principal
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

## Resource Group
Next up create a resource group to accomodate your AKS cluster with:
```
az group create --name moveez_aks_rg --location "East US"
```

## Azure Resource Manager Template
Finally you need to create your ARM-template as the Infrastructue-as-Code definition to deploy the AKS via Azure CLI. You can do this by opening portal.azure.com and selecting a new AKS cluster. Configure everything as you need and instead of deploying it via GUI, export the template files. You'll get a selection of different files, but you'll only need the following (as you can see in this folder):
- template.json
- parameters.json
- deploy.sh

Open the parameters.json file and replace the `null` values of `servicePrincipalClientId` and `servicePrincipalClientSecret` with the actual values.
> DANGER: never commit those values to a shared repository, this data is sensitive and grants permission to your whole azure subscription! So threat them like your own credentials and keep them to you.

# Deployment
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