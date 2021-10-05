#!/bin/sh

setup_git() {
  # Set the user name and email to match the API token holder
  # This will make sure the git commits will have the correct photo
  # and the user gets the credit for a checkin
  git config --global user.email "vigneshm@agiratech.com"
  git config --global user.name "Vignesh M"
  git config --global push.default matching

  # Get the credentials from a file
  git config credential.helper "store --file=.git/credentials"

  # This associates the API Key with the account
  echo "https://${GITHUB_API_KEY}:@github.com" > .git/credentials
  git remote rm origin
  git remote add origin https://${GITHUB_API_KEY}@github.com/${TRAVIS_REPO_SLUG}.git

}

make_version() {
  # Make sure that the workspace is clean
  # It could be "dirty" if
  # 1. package-lock.json is not aligned with package.json
  # 2. npm install is run

  git checkout -- .
  # Echo the status to the log so that we can see it is OK
  git status

  # Run the deploy build and increment the package versions
  # %s is the placeholder for the created tag
  npm version patch -m "chore: release version %s [skip ci]"

  # make changes to the environment.prod file
  node build-scripts/versioning.js

  # committing the changes to the environment file
  git add src/environments/environment.prod.ts
  git commit -m "chore: version updated in env files %s [skip ci]"
}

setup_git
make_version
