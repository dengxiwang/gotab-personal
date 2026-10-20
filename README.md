# GoTab 新标签页私有化部署

GoTab 是免费的浏览器新标签页与个人网址导航，支持卡片拖拽、分组文件夹、壁纸、小组件、书签管理和账号云同步。可通过网页版、浏览器扩展使用，也可部署到个人服务器、NAS 或内网。

默认使用内置 SQLite，也支持 MySQL、PostgreSQL。管理后台提供完整站点备份、恢复和数据库迁移，Docker 可通过一个 `/app/data` 挂载集中保存配置与资源。

[官网](https://www.gotab.cn) · [在线使用](https://web.gotab.cn) · [Docker Hub](https://hub.docker.com/r/doxwant/gotab) · [Gitee](https://gitee.com/dengxiwang/gotab-personal) · [GitHub](https://github.com/dengxiwang/gotab-personal)

## Docker 部署

### Docker 命令

```bash
mkdir -p data
docker run -d \
  --name gotab-server \
  -p 8080:8080 \
  -e SERVER_PORT=8080 \
  -v "$(pwd)/data:/app/data" \
  --restart always \
  doxwant/gotab:latest
```

启动后访问 `http://服务器地址:8080/install`，设置管理员账号、站点信息和数据库。选择 SQLite 无需额外安装数据库，也无需提前创建 `config.toml`。已有站点按下方升级说明操作，无需重新初始化。

### Docker Compose

将以下内容保存为 `docker-compose.yml`（本项目也提供此文件）：

```yaml
services:
  gotab-server:
    image: doxwant/gotab:latest
    container_name: gotab-server
    ports:
      - "8080:8080"
    environment:
      - SERVER_PORT=8080
    volumes:
      - ./data:/app/data
    restart: always
```

在配置所在目录执行：

```bash
mkdir -p data
docker compose up -d
```

### 数据存放位置

```text
data/
├── config.toml    # 站点与数据库配置
├── gotab.db       # 首次选择 SQLite 时的默认数据库文件
├── uploads/       # 用户上传文件
├── sourceStore/   # 资源库
├── backup/        # 后台生成的完整 ZIP 备份
└── backups/       # 恢复前自动保存的安全备份
```

SQLite 的实际路径以后台“数据管理”为准，迁移时可能生成新文件名。请持久化整个目录，保留运行时的 `-wal`、`-shm` 文件；完整备份使用后台功能，不要在运行中只复制 `.db`。MySQL / PostgreSQL 的数据库文件由对应数据库服务保存，GoTab 完整备份仍包含其业务数据。

### 已有部署与升级

原有 `config.toml`、`uploads`、`sourceStore` 挂载继续有效，仍使用同一个镜像。原配置位于 `/app/config.toml` 或 `/config.toml` 均可；缺少 `database.type` 的旧配置仍按 MySQL 读取。保留现有路径和网络设置，启用完整备份、恢复或迁移时，在原挂载中增加一项：

```yaml
volumes:
  - ./uploads:/app/uploads
  - ./sourceStore:/app/sourceStore
  - ./config.toml:/app/config.toml
  - ./data:/app/data
```

前三项按自己的原配置保留。创建 `data` 目录后，更新镜像并重建容器：

```bash
mkdir -p data
docker compose pull
docker compose up -d
```

- **空 data 接续原站点**：没有实际配置时，继续使用原配置和资源，无需重新初始化；增加挂载本身不会切换数据库或搬动文件。
- **已有 data 配置优先**：未显式覆盖路径时，优先使用 `/app/data/config.toml` 及其资源。已有另一套站点时，先核对数据，不能直接删除 data。
- **后台迁移时统一目录**：当前数据目录为已持久化挂载的 `/app/data` 时，“迁移并切换”会同时复制配置、`uploads`、`sourceStore` 并切换到 data；原数据库和原文件保留，`/uploads/...`、`/sourceStore/...` 地址不变。确认正常后可移除旧挂载，容器重建继续使用 data。

显式 `GOTAB_CONFIG_PATH`、`GOTAB_UPLOADS_DIR`、`GOTAB_SOURCE_STORE_DIR` 指向旧位置时，先按后台提示处理冲突。非 Docker 或通过 `GOTAB_DATA_DIR` 使用其他数据目录的部署，迁移时沿用原目录。不要将空目录直接挂载到整个 `/app`，以免遮住程序和网页文件。

增加 data 后意外进入初始化页时，先检查原挂载和配置，勿重复初始化。若尚未完成另一套初始化，保留原文件并更新镜像可接续原站点；已生成另一套实际配置时，需先核对两套数据。

## 数据库与数据管理

- **SQLite**：内置数据库，无需独立服务，适合单实例部署。
- **MySQL**：支持 MySQL 8.0+，默认 TCP 端口 `3306`，也支持 Unix Socket。
- **PostgreSQL**：默认端口 `5432`，支持按数据库要求选择 SSL 加密与证书校验模式。

MySQL / PostgreSQL 地址应是 GoTab 容器可以访问的地址；容器内的 `127.0.0.1` 指向自身。目标数据库需为空，账号需具备建表和读写权限；具备建库权限时也可在初始化或迁移时自动创建。执行“测试连接”前，请先创建目标数据库。

管理员从个人中心进入管理端，或登录后访问 `/console`，在“数据管理”中操作：

- **生成完整备份 ZIP**：包含全部业务数据库记录、配置、上传文件和资源库，先保存在服务器 `backup/`，可按需选择下载。
- **从 ZIP 恢复**：覆盖当前站点数据，保留当前数据库连接和服务地址。完成后用备份中的账号重新登录；出现同步选择时，选择“使用云端数据”。
- **迁移并切换**：支持 SQLite、MySQL、PostgreSQL 互迁及同类型数据库迁移。复制和校验成功后在线切换，无需重启，原数据库保留；SQLite 使用新文件。直接修改配置不会迁移数据。
- **数据清理**：保留原清理功能。

备份、恢复和迁移期间暂停其他数据读写，请保持页面打开。完整 ZIP 含账号和服务配置，请妥善保管。操作中断时保留原文件、挂载和恢复日志，修复存储或权限问题后重启，勿在恢复完成前删除容器或旧文件。

## 个人数据迁移

“设置 → 迁移备份”默认导出 JSON，可勾选“附带图标文件”生成 `.gotabpack` 随行包：优先读取可访问的本地缓存，单个图标最多 200 KiB，无法读取、超大或不支持的图标保留原地址。

导入时可仅导入数据，或登录后逐个上传图标；哈希相同且文件有效时直接复用。关闭弹窗或点击取消可停止后续处理，已上传的文件保留。个人备份仅用于自己的主页，不能代替完整站点备份。

## 程序包部署

选择对应操作系统与处理器架构的后端程序，与同版本的完整 `web/` 目录放在一起。Linux / macOS 可将程序重命名为 `gotab-server` 后运行：

```bash
chmod +x ./gotab-server
./gotab-server -port=8080
```

Windows 使用对应 `.exe`。首次访问同样按初始化向导配置。默认使用程序目录保存配置和 SQLite；程序旁已有 `data/` 或设置了自定义路径时，以后台显示的路径为准。非 Docker 迁移数据库不会自动搬动资源目录。

## 使用提示

- 未登录时，主页数据保存在当前浏览器；登录后可使用账号同步。管理员可单独编辑默认主页数据。
- 使用反向代理时，为备份上传预留足够的请求大小和超时时间；避免缓存 API 和站点配置文件，备份较大时预留足够磁盘空间。

## 界面预览

![GoTab 主页](https://github.com/user-attachments/assets/9e9d7ce4-e63f-4ec6-a319-b3afb538fe83)

![GoTab 卡片布局](https://github.com/user-attachments/assets/a6bc5871-80d5-412c-9b65-6345e563d5df)

![GoTab 个性化设置](https://github.com/user-attachments/assets/a1b34288-b356-44b1-8789-3736db4eaa2e)

## 帮助与支持

QQ 群：727809499。需要云服务器可了解[雨云服务器](https://www.rainyun.com/gotab_)，感谢支持。

### 捐赠支持

<p class="flex flex-wrap gap-3 items-start">
  <img src="https://github.com/user-attachments/assets/7c379a17-475d-432f-944e-292f39e0e0ba" width="200" hspace="6" alt="微信支付二维码">
  <img src="https://github.com/user-attachments/assets/e3681a43-aec3-4601-a1dd-272c83145e85" width="200" hspace="6" alt="支付宝二维码">
  <img src="https://github.com/user-attachments/assets/3423b752-efbd-4fb4-b330-402276d645d1" width="200" hspace="6" alt="爱发电支持二维码">
</p>
