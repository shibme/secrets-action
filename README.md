# :gear: `secrets-action`
> Write secrets to your GitHub organization, repository or environments from the workflow

## About
This action allows you to write secrets to your organization, repository or environments from the workflow. This is useful when you want to write dynamically generated secrets.

## Usage
You can use the action in your workflow as follows:

```yaml
- name: Write secret
  uses: actions/secrets-action@v1.0.0
  with:
    github-token: ${{ secrets.GH_TOKEN_WITH_SECRET_READ_WRITE_PERMISSION }}
    owner: 'my-org'
    repo: 'my-repo'
    secret-name: 'MY_SECRET'
    secret-value: 'my-secret-value'
```

## Permissions Required
The action requires the following permissions:
- Read and Write permission to organization secrets
- Read and Write permission to repository secrets
- Read and Write permission to repository environments
The scope of the permissions depends on the type of the secret (org, repo or environment) you are trying to write.

## Inputs
The actions supports the following inputs:

- `github-token`: To write the secret to the organization, repository or environment, the action requires a GitHub token with the required permissions
- `owner`: The GitHub organization or user
- `repo`: The GitHub repository name to add the actions secret (for repository-level secrets)
- `environment`: The environment name in the repository to add the secret (for environment secrets)
- `secret-name`: The name of the secret
- `secret-value`: The value of the secret
- `overwrite`: Overwrite the secret if it already exists (default: `true`)

## Outputs
The actions supports the following outputs:

- `secret-existed`: The secret already existed in the org/repository/environment