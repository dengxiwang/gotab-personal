# 构建阶段
FROM --platform=$BUILDPLATFORM alpine AS builder

ARG TARGETOS
ARG TARGETARCH
ARG SERVER_PORT=8080   # 构建阶段默认值

WORKDIR /app

COPY gotab-server-${TARGETOS}-${TARGETARCH} gotab-server
RUN chmod +x gotab-server

COPY web ./web/

# =============================
# 最终运行环境
# =============================
FROM alpine

WORKDIR /app

COPY --from=builder /app/gotab-server .
COPY --from=builder /app/web ./web/

# 在最终运行环境中执行目标架构程序，同时校验前端资源，避免发布无法启动的镜像。
RUN ./gotab-server -h

# 同一镜像自动识别旧的分散挂载和新的 /app/data 挂载。
# 不预建 data、不设置默认路径变量：Docker 挂载会创建目标目录，
# data 用于 SQLite、备份与维护日志；已有 data/config.toml 时优先使用整套 data 配置及资源。
# 新增空 data 挂载时继续读取旧 /app/config.toml（兼容 /config.toml）及已有资源，无需重新初始化。
# 后台数据库迁移成功后统一使用 data 中的配置和资源，旧文件保留，资源访问地址不变。

# 定义运行时环境变量
ENV SERVER_PORT=8080
EXPOSE ${SERVER_PORT}

CMD ["sh", "-c", "exec ./gotab-server -port=\"${SERVER_PORT}\""]

# 多平台构建

# 第一步：

# docker buildx create --name mybuilder --use

# 第二步（本地测试）：

# VERSION=2.3.0.5
# docker buildx build \
#     --platform linux/arm64 \
#     -t doxwant/gotab:${VERSION} \
#     -t doxwant/gotab:latest \
#     --load \
#     --no-cache \
#     .

# 第三步（多平台构建推送）：

# VERSION=2.3.0.5
# docker buildx build \
#     --platform linux/amd64,linux/arm64 \
#     -t doxwant/gotab:${VERSION} \
#     -t doxwant/gotab:latest \
#     --push \
#     --no-cache \
#     .
