#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 || ! "$2" =~ ^linux/(amd64|arm64)$ ]]; then
    echo "用法：$0 <本地镜像名或摘要> <linux/amd64|linux/arm64>" >&2
    exit 2
fi

image="$1"
platform="$2"
container_id=""
container_name="gotab-smoke-${platform##*/}-$$-$RANDOM"

cleanup() {
    local result=$?
    trap - EXIT
    if [[ -n "$container_id" ]]; then
        if [[ "${KEEP_SMOKE_CONTAINER:-0}" == "1" ]]; then
            echo "已保留验收容器：$container_name（清理：docker rm -f $container_name）" >&2
        else
            docker rm -f "$container_id" >/dev/null 2>&1 || true
        fi
    fi
    exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# 使用镜像原有 CMD，不挂载数据、不映射宿主机端口，也不访问外网。
container_id=$(docker create --name "$container_name" --platform "$platform" \
    --pull=never --network none --env SERVER_PORT=18080 "$image")
image_id=$(docker inspect --format '{{.Image}}' "$container_id")
actual_platform=$(docker image inspect --format '{{.Os}}/{{.Architecture}}' "$image_id")
if [[ "$actual_platform" != "$platform" ]]; then
    echo "镜像平台不匹配：期望 $platform，实际 $actual_platform" >&2
    exit 1
fi
docker start "$container_id" >/dev/null

for ((attempt = 1; attempt <= 30; attempt++)); do
    if [[ "$(docker inspect --format '{{.State.Running}}' "$container_id")" != "true" ]]; then
        break
    fi
    if docker exec "$container_id" sh -c '
        wget -T 3 -S -O /tmp/gotab-smoke-response http://127.0.0.1:18080/api/getSiteConfig >/tmp/gotab-smoke-http.log 2>&1 &&
        grep -Eq "HTTP/1\.[01] 200 " /tmp/gotab-smoke-http.log &&
        grep -Eq "\"code\"[[:space:]]*:[[:space:]]*200[,}]" /tmp/gotab-smoke-response
    ' >/dev/null 2>&1; then
        echo "验收通过：$image ($platform)，默认启动命令与站点配置接口正常。"
        exit 0
    fi
    sleep 1
done

echo "验收失败：$image ($platform) 未正常响应站点配置接口。" >&2
docker logs --tail 40 "$container_id" >&2 || true
docker exec "$container_id" cat /tmp/gotab-smoke-http.log >&2 2>/dev/null || true
exit 1
