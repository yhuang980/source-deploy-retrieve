# Salesforce Source Deploy Retrieve Test Utils

[![CircleCI](https://circleci.com/gh/forcedotcom/source-deploy-retrieve.svg?style=svg&circle-token=8cab4c48eb81996544b9fa3dfa29e6734376b73f)](https://circleci.com/gh/forcedotcom/source-deploy-retrieve)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
![npm (scoped)](https://img.shields.io/npm/v/@salesforce/metadata-mock-registry)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Introduction

A JavaScript toolkit providing test constants for classifications of metadata types. Used in testings in the [Salesforce VS Code Extensions](https://github.com/forcedotcom/salesforcedx-vscode) and [Source Deploy Retrieve](https://github.com/forcedotcom/source-deploy-retrieve).

## Advantages of using test constants in this library

- Less code. Creating SourceComponents by hand takes effort and results in a lot of duplicated code within the tests.
- More abstraction. Tests in the past used specific examples of components (such as an ApexClass component) where now tests can use abstract categories of components (such as a MatchingContentFile component). These abstract categories exactly match with the different categories of functionality defined by SDR.
- Easier edge case testing. The components in mock/registry can be set up to account for edge cases and then easily used. For example, to test conflict detection with a child component we could now just import decomposed.DECOMPOSED_CHILD_COMPONENT_1.

## Usage

Install the package:

```
npm install @salesforce/source-deploy-retrieve-test-utils
```

Examples:

```typescript
const { matchingContentFile, decomposed } = require('@salesforce/source-deploy-retrieve-test-utils');

// import a matchingContentFile component
const deployComponentOne = matchingContentFile.COMPONENT;
// import a decomposed component
const deployComponentTwo = decomposed.DECOMPOSED_COMPONENT;
```
