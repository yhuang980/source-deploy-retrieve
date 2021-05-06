#!/usr/bin/env bash

# For publishing a different version, see the format below for adding a publish-type
# parameter:
# "publish-type": "minor"

CircleCIToken=$1
curl -v -u ${CircleCIToken}: -X POST --header "Content-Type: application/json" -d '{
  "branch": "enableRegistryBot",
  "parameters": {
    "update-registry": true,
  }
}' https://circleci.com/api/v2/project/gh/forcedotcom/source-deploy-retrieve/pipeline