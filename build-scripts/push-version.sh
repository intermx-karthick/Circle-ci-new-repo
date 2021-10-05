#!/bin/sh

upload_files() {
  # This make sure the current work area is pushed to the tip of the current branch
  git push origin HEAD:$TRAVIS_BRANCH

  # This pushes the new tag
  git push --tags
}

upload_files
