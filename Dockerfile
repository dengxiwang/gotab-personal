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

# 同一镜像自动识别旧的分散挂载和新的 /app/data 挂载。
# 不预建 data、不设置默认路径变量：Docker 挂载会创建目标目录，
# 两种布局同时存在时 data 优先；只有旧挂载时仍沿用 /app 根目录。

# 定义运行时环境变量
ENV SERVER_PORT=8080
EXPOSE ${SERVER_PORT}

CMD ["sh", "-c", "exec ./gotab-server -port=\"${SERVER_PORT}\""]

# 多平台构建

# 第一步：

# docker buildx create --name mybuilder --use

# 第二步（本地测试）：

# VERSION=2.2.1.4
# docker buildx build \
#     --platform linux/arm64 \
#     -t doxwant/gotab:${VERSION} \
#     -t doxwant/gotab:latest \
#     --load \
#     --no-cache \
#     .

# 第三步（多平台构建推送）：

# VERSION=2.2.1.4
# docker buildx build \
#     --platform linux/amd64,linux/arm64 \
#     -t doxwant/gotab:${VERSION} \
#     -t doxwant/gotab:latest \
#     --push \
#     --no-cache \
#     .
