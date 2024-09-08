# :gear: `secrets-action`
> Write secrets to your GitHub organization, repository or environments from the workflow

## About
This action allows you to write secrets to your organization, repository or environments from the workflow. This is useful when you want to write dynamically generated secrets.

## Permissions Required
The action requires the following permissions:
- Read and Write permission to organization secrets
- Read and Write permission to repository secrets
- Read and Write permission to repository environments
The scope of the permissions depends on the type of the secret (org, repo or environment) you are trying to write.

## Inputs
The actions supports the following inputs:

- `github-token`: GitHub token to use for downloading SLV (To avoid rate-limits)
- `owner`: The GitHub organization or user name
- `repo`: The GitHub repository name to add the actions secret (for repository secrets)
- `environment`: The environment name in the repository to add the secret (for environment secrets)
- `secret-name`: The name of the secret
- `secret-value`: The value of the secret
- `overwrite`: Overwrite the secret if it already exists (default: `true`)

## Outputs
The actions supports the following outputs:

- `secret-existed`: The secret already existed in the org/repository/environment