#!/usr/bin/env bash

CircleCIToken=$1
curl -v -u ${CircleCIToken}: -X POST --header "Content-Type: application/json" -d '{
  "branch": "enableRegistryBot",
  "parameters": {
    "run-update-registry": true
  }
}' https://circleci.com/api/v2/project/gh/forcedotcom/source-deploy-retrieve/pipeline