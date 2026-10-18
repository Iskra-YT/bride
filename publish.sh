#!/usr/bin/env bash
set -Eeuo pipefail

die() {
    echo "Error: $*" >&2
    exit 1
}

bump="${1:-}"

case "$bump" in
    major|minor|patch) ;;
    *) die "Usage: ./publish.sh <major|minor|patch>" ;;
esac

command -v git >/dev/null || die "Git is required."
command -v npm >/dev/null || die "npm is required."
command -v node >/dev/null || die "Node.js is required."

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || die "Not inside a Git repository."

[[ -f package.json ]] || die "package.json not found."

if [[ -n "$(git status --porcelain)" ]]; then
    die "Working tree is not clean. Commit or stash your changes first."
fi

branch="$(git branch --show-current)"
[[ -n "$branch" ]] || die "Detached HEAD is not supported."

# node -p and npm read stdin when it is a pipe, which would starve the
# confirmation prompt below — always give them an empty stdin instead.
old_version="$(node -p "require('./package.json').version" </dev/null)"

echo "Current version: $old_version"
echo "Release type:    $bump"
echo

# Update package.json and package-lock.json without
# letting npm create its own commit or tag. stdin is redirected so that npm
# cannot swallow the input meant for the confirmation prompt below.
#
# The tree was clean when the script started, so if anything fails between
# the bump and the commit, reverting both files leaves no mess behind.
released=0
revert_bump() {
    [[ "$released" -eq 1 ]] && return
    git checkout -- package.json 2>/dev/null || true
    git checkout -- package-lock.json 2>/dev/null || true
}
trap revert_bump EXIT

npm version "$bump" --no-git-tag-version --ignore-scripts </dev/null

new_version="$(node -p "require('./package.json').version" </dev/null)"
tag="v$new_version"

git diff --check || die "Whitespace errors detected."

if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
    die "Tag $tag already exists locally."
fi

if git ls-remote --exit-code --tags origin "refs/tags/$tag" \
    >/dev/null 2>&1; then
    die "Tag $tag already exists on origin."
fi

echo
echo "Release: $old_version -> $new_version"
echo "Branch:  $branch"
echo "Commit:  release: $tag"
echo "Tag:     $tag"
echo

read -r -p "Create release and push to origin? [y/N] " answer \
    || answer=""

if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    die "Cancelled. The version bump has been reverted."
fi

git add package.json
[[ ! -f package-lock.json ]] || git add package-lock.json

git commit -m "release: $tag"
released=1
git tag -a "$tag" -m "Release $tag"

git push origin "HEAD:refs/heads/$branch"
git push origin "refs/tags/$tag"

echo
echo "Release $tag pushed successfully."
echo "Check GitHub Actions for npm publication status."
