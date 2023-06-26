# runs on remote machine via deploy workflow
# pulls latest changes, then restarts the process instance
# process is managed via PM2

processName="rimworld-mod-catalogue"

# exit when any command fails
set -e

git reset --hard --quiet

echo "Pulling from origin"
git pull --quiet

echo "Installing dependencies"
pnpm install --silent --frozen-lockfile

echo "Deleting old build"
rm -rf build/

echo "Building"
pnpm build

echo "Removing development dependencies"
pnpm install --silent --frozen-lockfile --production

echo "Killing old instance"
# deletion is allowed to fail, since the process might not have been running previously
pm2 delete $processName --silent || true 

echo "Starting new instance"
export NODE_ENV=production
pm2 start . --name $processName --silent
