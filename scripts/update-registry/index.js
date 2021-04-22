#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Connection, AuthInfo } = require('@salesforce/core');
const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require("@octokit/auth-app");
const { run, execSilent } = require('../util');
const update = require('./update');

const { REPO_OWNER, REPO_NAME, INSTALLATION_ID, APP_ID } = process.env; 
const BASE_BRANCH = 'develop';

const REGISTRY_PATH = path.join(
  __dirname,
  '..',
  '..',
  'src',
  'registry',
  'registry.json'
);

const API_VERSION_FLAG = '-a';
const SOURCE_PATH_FLAG = '-p';
const SOURCE_ORG_FLAG = '-u';

function printHelp() {
  const message = `
usage: registry-update ${API_VERSION_FLAG} apiVersion [${SOURCE_PATH_FLAG} <describe.json path>] [${SOURCE_ORG_FLAG} <org username>]

Update the metadata registry db with a new version of the response from a describeMetadata()
call.

A describe response can be provided from a local file using ${SOURCE_PATH_FLAG}, OR by querying an org
with a given username using ${SOURCE_ORG_FLAG}. If querying the response from an org, make sure it has been
authenticated to beforehand with the Salesforce CLI.

The update process only adds new entries or modifies existing ones. Please manually review
the changes after they have been generated to ensure there were no unexpected modifications. 
`
  console.log(message);
}

function exitWithInstructions(message) {
  console.log(message);
  printHelp();
  process.exit();
}

async function getConnection(username) {
  return Connection.create({
    authInfo: await AuthInfo.create({ username }),
  });
}

function getDescribeFromFile(fsPath) {
  const describeFilePath = !path.isAbsolute(fsPath)
      ? path.resolve(process.cwd(), fsPath)
      : fsPath;
  return JSON.parse(fs.readFileSync(describeFilePath));
}

async function getDescribeFromOrg(username, apiVersion) {
  const conn = await getConnection(username);
  if (apiVersion) {
    conn.setApiVersion(apiVerison);
  } else {
    apiVersion = conn.getApiVersion();
  }
  const result = await run(
    `Fetching metadata describe v${apiVersion}`,
    () => conn.metadata.describe()
  );
  return { result, apiVersion }
}

async function fetchDescribeResult(source, sourceArg, apiVersion) {  
  if (source === '-p') {
    return {
      result: getDescribeFromFile(sourceArg),
      apiVersion
    }
  } else if (source === '-u') {
    return getDescribeFromOrg(sourceArg, apiVersion);
  } else {
    exitWithInstructions(`Invalid source type ${source}.`);
  }
}

function registryHasChanges() {
  return execSilent('git status').includes('registry.json');
}

async function openPullRequest(head, apiVersion) {
  const app = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      id: APP_ID,
      privateKey: process.env.SDR_BOT_KEY,
      installationId: INSTALLATION_ID
    }
  });

  await app.auth({ type: 'installation', installationId: INSTALLATION_ID });

  return app.pulls.create({
    base: `refs/heads/${BASE_BRANCH}`,
    head: `refs/heads/${head}`,
    owner: REPO_OWNER,
    repo: REPO_NAME,
    title: `chore: metadata registry update (v${apiVersion})`,
    body: `Metadata registry update with the latest available Metadata API version v${apiVersion}`
  });
}

function getArgForFlag(flagValue) {
  const index = process.argv.indexOf(flagValue);
  const arg = index > -1 && process.argv[index + 1] ? process.argv[index + 1] : null;
  if (!arg) {
    exitWithInstructions(`Required argument value ${arg} for flag ${flagValue} is invalid.`);
  }
}

function getSource() {
  const pathSource = process.argv.indexOf(SOURCE_PATH_FLAG);
  const orgSource = process.argv.indexOf(SOURCE_ORG_FLAG);
  if (pathSource > -1 && orgSource > -1) {
    exitWithInstructions(`Only one source is required for the describe call - either ${SOURCE_PATH_FLAG} or ${SOURCE_ORG_FLAG}`);
  }
  if (pathSource === -1 && orgSource === -1) {
    exitWithInstructions(`The source for the describe call is required - either ${SOURCE_PATH_FLAG} or ${SOURCE_ORG_FLAG}`);
  }
  return pathSource > -1 ? pathSource : orgSource;
}

async function main() {
  let apiVersion = getArgForFlag(API_VERSION_FLAG);
  const source = getSource();
  const sourceArg = getArgForFlag(source);

  const describeResult = await fetchDescribeResult(source, sourceArg, apiVersion);
  if (!describeResult) {
    exitWithInstructions('Describe result is empty.');
  }

  apiVersion = describeResult.apiVersion;
  const branchName = `registry-update-v${apiVersion}`;

  run('Applying registry updates', () => {
    execSilent(`git checkout -b ${branchName} ${BASE_BRANCH}`)

    const registry = fs.existsSync(REGISTRY_PATH)
      ? JSON.parse(fs.readFileSync(REGISTRY_PATH))
      : { types: {}, suffixes: {}, strictTypeFolder: {} };;

    update(registry, describeResult.result);
    registry.apiVersion = apiVersion;

    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  });

  if (registryHasChanges()) {
    run('Creating pull request for registry updates', async () => {
      execSilent(`git add ${REGISTRY_PATH}`);
      execSilent(`git commit -m "chore: update registry for v${apiVersion}"`);
      execSilent(`git push origin ${branchName}`);

      await openPullRequest(branchName, apiVersion);
    });
  }
}

main();
