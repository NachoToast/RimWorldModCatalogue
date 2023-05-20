BASE=$(realpath $(dirname $0))

CLIENT=$(realpath "$BASE/../src/types")
SERVER=$(realpath "$BASE/../../server/src/types/shared")

ln -s "$SERVER" "$CLIENT"
