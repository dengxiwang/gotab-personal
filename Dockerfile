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

# 定义运行时环境变量
ENV SERVER_PORT=8080
EXPOSE ${SERVER_PORT}

CMD ["sh", "-c", "echo Running server on port $SERVER_PORT && ./gotab-server -port=$SERVER_PORT"]

# 多平台构建

# 第一步：

# docker buildx create --name mybuilder --use

# 第二步（本地测试）：

# VERSION=2.0.1.10
# docker buildx build \
#     --platform linux/arm64 \
#     -t doxwant/gotab:${VERSION} \
#     -t doxwant/gotab:latest \
#     --load \
#     --no-cache \
#     .

# 第三步（多平台构建推送）：

# VERSION=2.0.1.10
# docker buildx build \
#     --platform linux/amd64,linux/arm64 \
#     -t doxwant/gotab:${VERSION} \
#     -t doxwant/gotab:latest \
#     --push \
#     --no-cache \
#     .