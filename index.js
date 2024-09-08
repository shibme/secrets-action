const core = require('@actions/core');
const sodium = require('libsodium-wrappers');
const { Octokit } = require("@octokit/rest");

const token = core.getInput('github-token');
const userAgent = 'secrets-action';
const owner = core.getInput('owner');
const repo = core.getInput('repo');
const environment = core.getInput('environment');
const secretName = core.getInput('secret-name');
const secretValue = core.getInput('secret-value');
const overwrite = core.getInput('overwrite').toLowerCase() === 'true';

let octokit;
if (token) {
  const { createTokenAuth } = "@octokit/auth-token";
  octokit = new Octokit({
    authStrategy: createTokenAuth,
    auth: token,
    userAgent: userAgent,
  });
} else {
  octokit = new Octokit({
    userAgent: userAgent,
  });
}

async function encryptSecret(secret, key) {
  await sodium.ready;
  let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
  let binsec = sodium.from_string(secret);
  let encBytes = sodium.crypto_box_seal(binsec, binkey);
  let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
  return output;
}

async function getPublicKey(owner, repo, environment) {
  if (repo) {
    if (environment) {
      core.info(`Getting public key for the environment ${environment} in repository ${owner}/${repo}`);
      const repoEnvPublicKey = await octokit.request('GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/public-key', {
        owner: owner,
        repo: repo,
        environment_name: environment
      });
      return repoEnvPublicKey.data;
    } else {
      core.info(`Getting public key for the repository ${owner}/${repo}`);
      const repoPublicKey = await octokit.request('GET /repos/{owner}/{repo}/actions/secrets/public-key', {
        owner: owner,
        repo: repo
      });
      return repoPublicKey.data;
    }
  } else {
    core.info(`Getting public key for the organization ${owner}`);
    const orgPublicKey = await octokit.request('GET /orgs/{org}/actions/secrets/public-key', {
      org: owner
    });
    return orgPublicKey.data;
  }
}

async function isSecretExist(owner, repo, environment, secretName) {
  try {
    let secretMeta;
    if (repo) {
      if (environment) {
        core.info(`Checking if the secret ${secretName} exists in the environment ${environment} of the repository ${owner}/${repo}`);
        secretMeta = await octokit.request('GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}', {
          owner: owner,
          repo: repo,
          environment_name: environment,
          secret_name: secretName
        });
      } else {
        core.info(`Checking if the secret ${secretName} exists in the repository ${owner}/${repo}`);
        secretMeta = await octokit.request('GET /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
          owner: owner,
          repo: repo,
          secret_name: secretName
        });
      }
    } else {
      core.info(`Checking if the secret ${secretName} exists in the organization ${owner}`);
      secretMeta = await octokit.request('GET /orgs/{org}/actions/secrets/{secret_name}', {
        org: owner,
        secret_name: secretName
      });
    }
    if (secretMeta.status === 200) {
      core.info(`The secret ${secretName} exists and was created at ${new Date(secretMeta.data.created_at).toLocaleString()} and last updated at ${new Date(secretMeta.data.updated_at).toLocaleString()}`);
    } else {
      core.info(`The secret ${secretName} does not exist`);
    }
    return secretMeta.status === 200;
  } catch (error) {
    if (error.status === 404) {
      return false;
    } else {
      throw error;
    }
  }
}

async function putSecret(owner, repo, environment, secretName, secretValue) {
  const publicKeyData = await getPublicKey(owner, repo, environment);
  const encryptedValue = await encryptSecret(secretValue, publicKeyData.key);
  if (repo) {
    if (environment) {
      core.info(`Writing secret ${secretName} to the environment ${environment} in the repository ${owner}/${repo}`);
      await octokit.request('PUT /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}', {
        owner: owner,
        repo: repo,
        environment_name: environment,
        secret_name: secretName,
        encrypted_value: encryptedValue,
        key_id: publicKeyData.key_id
      });
    } else {
      core.info(`Writing secret ${secretName} to the repository ${owner}/${repo}`);
      await octokit.request('PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
        owner: owner,
        repo: repo,
        secret_name: secretName,
        encrypted_value: encryptedValue,
        key_id: publicKeyData.key_id
      });
    }
  } else {
    core.info(`Writing secret ${secretName} to the organization ${owner}`);
    await octokit.request('PUT /orgs/{org}/actions/secrets/{secret_name}', {
      org: owner,
      secret_name: secretName,
      visibility: 'all',
      encrypted_value: encryptedValue,
      key_id: publicKeyData.key_id
    });
  }
}

async function run() {
  try {
    const exists = await isSecretExist(owner, repo, environment, secretName);
    core.setOutput('secret-existed', exists);
    if (overwrite || !exists) {
      await putSecret(owner, repo, environment, secretName, secretValue);
    } else {
      await putSecret(owner, repo, environment, secretName, secretValue);
    }
  } catch (error) {
    core.setFailed(error);
  }
}

module.exports = run

if (require.main === module) {
  run();
}
