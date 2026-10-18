# Gotab 新标签页私有化部署

### 特点

免费、清爽、功能齐全、可配置项多！

### 项目简介

Gotab 新标签页是 funtabs 新标签页的重构版本，由于之前的版本是刚自学之后的第一版，传参都是一层一层的写，后期接触到 redux，发觉已经改不动了，而且感觉大家更喜欢 itab,wetab 中的某些功能，但是做起来由于没有规划，已经是相当难受，所以重构了一下，本项目前端使用 Vite 脚手架构建，后端使用 golang 编写，得益于 golang 的特性，后端程序仅一个二进制文件。用于打造个性化浏览器新标签页、起始页、个人主页。

### 官网

[https://www.gotab.cn](https://www.gotab.cn)

### 在线预览

demo 地址：[https://test.gotab.cn](https://test.gotab.cn)，用户名：admin，密码：123456

### 准备工作

NAS 终端或云服务器或其他设备（没有云服务器或者需要购买云服务器的可以看下我的推广：[雨云服务器](https://www.rainyun.com/gotab_)，感谢您的支持）。初始化时可选择 SQLite 或 MySQL 8.0+；SQLite 无需单独安装数据库服务。网站配置保存在 `config.toml`，SQLite 数据文件和上传文件也需要持久化保存。

### 用户帮助

有任何问题，欢迎加群反馈交流，比较及时：QQ 群 727809499

## docker 部署

旧的分散挂载和新的单目录挂载使用**同一个镜像、同一套构建命令**，由程序在启动时识别目录，无需选择不同版本的镜像，也无需为标准挂载设置路径环境变量。Docker Hub 每次只需发布同一版本的镜像，即可同时支持两种挂载方式。项目仅保留一个 `docker-compose.yml`，默认采用 `/app/data` 单目录挂载；旧部署可继续使用自己的 Compose 配置。未显式覆盖路径时，两种布局同时存在会优先使用 `/app/data`。

### 新部署：统一挂载 /app/data

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

也可以在本项目目录执行 `docker compose up -d`，默认 `docker-compose.yml` 使用同样的单目录布局。首次打开 `/install`，完成初始化后，宿主机目录大致如下：

```text
data/
├── config.toml       # 数据库连接、邮件、站点配置等
├── config.toml.bak   # 上一次配置的副本（有配置更新后生成）
├── gotab.db          # 首次选择 SQLite 时生成；后续迁移可能使用新文件名
├── gotab.db-wal      # SQLite 运行期间可能生成
├── gotab.db-shm      # SQLite 运行期间可能生成
├── uploads/         # 用户上传文件
├── sourceStore/     # 资源库图标、壁纸和缩略图
├── backup/          # 后台生成的完整 ZIP，可稍后选择下载
└── backups/         # 恢复前自动保存的安全 ZIP
```

使用外部 MySQL 时，MySQL 数据仍保存在该数据库服务中；`data` 挂载负责配置和资源文件。需要迁移完整站点时，使用管理后台的完整 ZIP 备份功能。不要在程序运行中只复制 SQLite 的 `.db` 文件作为完整备份，运行中的写入可能仍在 `-wal` 文件内。

### 旧部署：原有三个挂载继续有效

只有原有的 `/app/config.toml`、`/app/uploads`、`/app/sourceStore` 挂载时，新版本继续沿用原目录，不会自动移动或覆盖这些文件。已有的 Compose 文件和网络设置也可以继续使用。镜像不预建 `/app/data`，因此原有挂载不会被镜像里的空目录抢占。

```bash
touch config.toml
mkdir -p uploads sourceStore
docker run -d \
  --name gotab-server \
  -p 8080:8080 \
  -e SERVER_PORT=8080 \
  -v "$(pwd)/uploads:/app/uploads" \
  -v "$(pwd)/sourceStore:/app/sourceStore" \
  --mount "type=bind,source=$(pwd)/config.toml,target=/app/config.toml" \
  --restart always \
  doxwant/gotab:latest
```

使用 Compose 的旧部署，继续保留自己的配置即可。若使用本项目唯一的 `docker-compose.yml`，可将服务中的 `volumes` 替换为下面三项，继续使用同一个 `doxwant/gotab:latest` 镜像：

```yaml
volumes:
  - ./uploads:/app/uploads
  - ./sourceStore:/app/sourceStore
  - type: bind
    source: ./config.toml
    target: /app/config.toml
```

保留旧部署原有的网络设置；原 Linux 主机网络部署可继续使用 `network_mode: host`，该模式下不同时配置 `ports`。Docker Desktop 可使用上面的端口映射命令。`config.toml` 必须是文件；若错误创建成目录，程序会报错，请先修正宿主机挂载。旧部署升级时不要直接用默认单目录配置覆盖原配置，以免挂载到空的 `data/` 后进入初始化页面。

旧的三个挂载适用于原有 MySQL 部署，升级不要求改动数据库配置，缺少 `database.type` 的旧配置仍按 MySQL 读取。新增的服务器 ZIP 备份、SQLite 以及恢复和迁移日志需要持久化空间；程序会在操作开始前拒绝将它们保存在 Docker 容器临时层中。需要这些功能时，可以保留旧文件位置并补充数据目录，也可以整理为单个挂载，见下文。

同时保留旧挂载和 `/app/data` 时，配置、资源与相对 SQLite 路径统一从 `/app/data` 读取。**即使 data 是空目录，也优先使用它并进入初始化，不会回退读取旧配置或自动合并两套数据。** 迁移旧站点时，应先按下面的步骤复制配置和资源，再启动新布局。

### 路径选择

路径在程序启动时确定，优先级为：

1. 显式设置 `GOTAB_DATA_DIR` 时，使用指定数据目录；仅设置 `GOTAB_CONFIG_PATH` 时，数据目录默认使用其所在目录。
2. 没有以上覆盖配置、但可执行文件同级存在 `data` 时，优先使用该目录；Docker 的 `/app/data` 挂载会自动创建这个目录。
3. 没有 `data` 时，继续使用可执行文件同级的原有布局，包括根目录 `config.toml`、`uploads` 和 `sourceStore`。

需要自定义混合挂载时，可分别设置 `GOTAB_CONFIG_PATH`、`GOTAB_UPLOADS_DIR`、`GOTAB_SOURCE_STORE_DIR`；它们覆盖各自路径。只指定 `GOTAB_CONFIG_PATH` 时，其他数据默认放在配置文件所在目录。容器内建议使用绝对路径。

自定义的 `uploads` 与 `sourceStore` 目录必须相互独立，不能包含配置文件、SQLite 数据库、`backup` 或 `backups` 目录，也不能放在备份目录内部；程序会检查这些路径，避免恢复资源文件时移动数据库或配置。

SQLite 初始化默认写入数据目录的 `gotab.db`。迁移到 SQLite 时，若该文件已存在，会使用 `gotab-日期时间.db` 新文件并更新配置，原文件保留；以后台“数据管理”显示的路径及 `[sqlite] path` 为准。相对路径始终相对于数据目录，绝对路径不会随挂载布局自动改写。SQLite 所在的**目录**也必须持久化，单独绑定 `.db` 文件不能保全 WAL、SHM 与维护日志。

### 保留旧文件位置，补充持久化目录

原有 MySQL 站点不想搬动配置和资源时，可停止原容器，保留三个原挂载及原网络设置，重建时增加一个数据目录和下面四个环境变量：

```bash
mkdir -p data
docker run -d \
  --name gotab-server \
  -p 8080:8080 \
  -e SERVER_PORT=8080 \
  -e GOTAB_DATA_DIR=/app/data \
  -e GOTAB_CONFIG_PATH=/app/config.toml \
  -e GOTAB_UPLOADS_DIR=/app/uploads \
  -e GOTAB_SOURCE_STORE_DIR=/app/sourceStore \
  --mount "type=bind,source=$(pwd)/config.toml,target=/app/config.toml" \
  -v "$(pwd)/uploads:/app/uploads" \
  -v "$(pwd)/sourceStore:/app/sourceStore" \
  -v "$(pwd)/data:/app/data" \
  --restart always \
  doxwant/gotab:latest
```

执行前应移除已停止的同名容器，保留所有宿主机文件及数据库卷。这种混合布局继续读取原 MySQL 连接和资源，`data/` 用于备份、恢复日志和后续新建的 SQLite 文件；容器重建时需要保留这四个环境变量。只设置 `GOTAB_CONFIG_PATH` 会让数据目录仍落在 `/app`，因此这里还必须设置 `GOTAB_DATA_DIR`。

不必把整个 `/app` 改为挂载目录。将空的宿主机目录直接挂到 `/app` 会遮住镜像中的后端程序和 `web/`，导致无法启动；以上混合布局可以保留镜像内的程序，同时持久化维护文件。如果原先已使用 SQLite，相对数据库路径也会随数据目录改变，须先按下一节复制实际数据库文件，不能直接套用空 `data/`。

### 整理为单个 /app/data 挂载

1. 先完成正在进行的恢复或迁移；若存在待恢复日志，先重启原容器完成恢复。停止应用写入并停止容器，保留原配置、资源及数据库备份，暂时不要删除原容器或旧文件。
2. 在原三个宿主机挂载目录所在位置创建一个**新的空目录**，复制配置和资源。例如尚无 `data` 时执行：

   ```bash
   mkdir data
   cp -p config.toml data/
   cp -a uploads sourceStore data/
   ```

3. 原来使用 MySQL 时，保持连接配置和 Docker 网络可达性，外置数据库不需要搬移。原来使用 SQLite 时，在应用停止后，将配置指向的实际数据库文件及存在的同名 `-wal`、`-shm` 文件一起复制到新数据目录；不要误选迁移前遗留的旧 `.db`。相对路径保留对应子目录，绝对路径则需要改为新位置，例如 `[sqlite] path = "gotab.db"`。已有的 `backup/`、`backups/` 也可一并保留。
4. 使用同一个镜像，只挂载新目录到 `/app/data`，去掉旧路径环境变量；例如上方新部署命令。如果复制的是 `data-next/`，将命令的宿主机路径相应替换。保留旧部署所需的网络设置，确认登录、主页数据、图片和后台显示的数据库路径都正确，再处理旧容器与目录。

两种布局并存时也不会自动复制或合并旧数据。首次看到安装页时，应先检查挂载与路径，不要在未迁移的空 `data` 中重复初始化旧站点。

默认 Compose 使用端口映射；MySQL 的地址需要是容器可以访问的地址。已有 Linux 主机网络部署可保留原 `network_mode: host` 配置，该模式下无需再声明 `ports`。

### 从源码构建发布

`gotab-personal` 保存最终部署产物。修改源码后，在 `gotab` 执行 `pnpm build`，将完整 `dist/` 同步到本项目的 `web/`；在 `staticweb` 构建安装页面，将 `out/` 内的产物同步到 `web/install/`。同时把本次 `gotab/dist/hash-manifest.json` 同步到 `gotab-server/static/hash-manifest.json`。最后在 `gotab-server` 执行 `./build.sh`，将 `bin/` 中对应平台的二进制同步到本项目后再构建 Docker 镜像。

前端资源、内嵌校验清单和后端二进制必须来自同一轮构建。SQLite 使用纯 Go 驱动，沿用 `CGO_ENABLED=0` 的 Linux amd64/arm64、macOS amd64/arm64、Windows amd64 发布方式；无需给原 Docker 镜像增加数据库系统库。

发布 Docker Hub 时沿用 `Dockerfile` 中的 `docker buildx build` 命令，一次构建即可同时发布 Linux amd64/arm64。版本标签（例如 `doxwant/gotab:2.2.1.4`）与 `doxwant/gotab:latest` 指向同一发布内容，新旧挂载无需分别构建或上传镜像。

## 数据管理

初始化页面可选择 SQLite 或 MySQL。旧 `config.toml` 没有 `database.type` 时仍使用 MySQL；SQLite 配置为 `[database] type = "sqlite"` 与 `[sqlite] path = "gotab.db"`，相对路径位于当前持久化数据目录。

后台“数据管理”保留原清理功能，并提供：

- **生成完整备份 ZIP**：先保存到数据目录的 `backup/`，生成后进入备份列表，选择某一份再下载；不下载也会保留在服务器。ZIP 格式版本 1，包含 13 张业务表全部记录（含软删除）、自增编号高水位、配置、上传文件和资源库文件。外置 MySQL 的业务数据会导出进 ZIP，不要求其物理文件位于 `/app/data`。已有 ZIP 不会再次打包进入新备份；请按磁盘容量定期保管和清理服务器备份。
- **恢复**：覆盖当前数据与资源，保留目标实例的数据库连接及 `server_url`。恢复后旧登录 Token 失效，使用备份中的账号重新登录；若出现本地与云端数据选择，选择云端，避免旧浏览器数据覆盖恢复结果。
- **迁移并切换**：表单回显当前数据库类型和保存的连接信息，密码不下发到浏览器，也不能切换为明文查看；留空会沿用已保存密码。改变主机、端口、连接方式或账号时需重新输入密码，避免将旧密码发送给不同数据库。MySQL 目标必须为空库；SQLite 自动使用新文件。全部数据复制和校验成功后切换，原数据库保留。手工修改连接配置不会自动搬移数据。

若恢复结果提示“数据已恢复，但页面配置更新失败”，数据库和资源已恢复，无需再次上传 ZIP；检查 `web/` 的写入权限、磁盘空间及 `siteConfig.js`，修复后重启程序，再重新登录。

恢复前会在当前数据目录的 `backups/` 自动保存安全 ZIP，统一挂载时为 `/app/data/backups`。恢复中断后，程序重启会依据日志自动回滚；初始化中断也会检查实际管理员创建状态。迁移配置提交期间通过 `migration-pending.json` 记录原配置：提交前中断恢复原数据库，提交完成后使用目标数据库。配置提交结果不确定时会暂停数据访问，避免旧库继续写入而磁盘配置指向新库。不要删除 `restore-pending.json`、`init-pending.json`、`migration-pending.json` 或关联安全 ZIP。若提示恢复失败，应先修复磁盘容量、权限等问题再重启，并保留独立备份；这些机制不保证磁盘损坏或断电下的绝对原子性。

旧三挂载没有持久化 `/app` 中的维护日志，新发起的恢复和数据库迁移也会检查日志目录是否已挂载；按上述混合布局补充数据目录，或整理到统一 `data` 挂载后即可使用。若此前已在旧布局中断过维护，程序仍允许读取旧日志自动恢复，应先重启原容器完成恢复，再考虑删除或重建容器；未挂载的旧恢复文件不能跨容器重建保留。统一 `/app/data` 挂载会同时持久化这些文件。

运行中的数据库迁移不需要重启 GoTab，但会暂时暂停数据读写：先等待已开始的请求完成，维护期间的新请求返回 HTTP 503 与 `Retry-After`，迁移和校验成功后恢复访问。时长取决于数据量及数据库速度。新版前端会保留本地修改并在维护结束后自动补传；关闭页面、切换账号或服务器后不会继续发送旧会话的重试。

备份、恢复和迁移会进入单实例维护窗口，期间其他数据请求暂时受限。不支持多个 GoTab 进程共享同库并发写入，外部程序的数据库写入也需暂停。ZIP 和恢复日志包含数据库、邮件等敏感配置，请限制保存目录和下载文件的访问权限。

上传请求与 ZIP 解压总量均限制 **10 GiB**，数据库单行备份限制 **128 MiB**，并需预留临时文件、安全备份及回滚副本的磁盘空间。使用 Nginx/1Panel 等代理时，应按实际体积调整 `client_max_body_size`、`proxy_read_timeout`、`proxy_send_timeout`、`client_body_timeout` 及上游上传超时。浏览器下载使用 Blob，实际大小还受浏览器与内存限制；大备份建议先完成一次实际体积的下载、上传和恢复测试。

## 注意事项

（1）管理后台路径：管理员 - 我的 - 管理端，或者登陆后直接访问 /console 路径；

（2）后台设置的一些功能性开关，对应着/web/siteConfig.js 文件，已经做了版本缓存控制，如变更配置无效请检查服务缓存，其他需要注意缓存的文件为：html 结尾的，/background.js，以及/api/\*路径开头的；

（3）数据是跟着用户走的，不登录的情况下默认的只是在本地进行缓存。数据分为两类，一类是默认主页数据（管理员可以在个人中心右上角编辑默认主页数据，也可以在管理后台的功能开关中调整默认主页数据策略），另一类是用户数据；

## 使用说明

### 1. 部署准备

您需要一台能够运行可执行文件的服务器或主机（如 Linux 服务器）。由于后端程序 `gotab-server` 是一个 Go 编译后的静态二进制文件，因此无需安装 Go 环境即可运行，项目进行了多平台构建，建议部署时将对应平台后端程序重命名为 `gotab-server` 。

### 2. 部署步骤

- 将项目中的 `gotab-server` 后端程序和 `/web` 目录下的前端文件上传至服务器上的同一目录。

- 确保给 `gotab-server` 赋予可执行权限，例如在 Linux 上执行：

  ```bash
  chmod 0755 gotab-server
  ```

- 在服务器上启动程序：

  ```bash
  ./gotab-server
  ```

- 根据需要指定端口

  ```bash
  ./gotab-server -port=端口
  ```

### 3. 1panel 示例

- 克隆或下载项目，把 gotab-server 后端程序还有/web 目录下所有程序放到服务器上，注意要给 gotab-server 二进制文件可执行权限（0755）

- 点击网站 - 运行环境 - GO - 创建 Go 运行环境

- 输入自定义名称

- 选择运行目录（即：该项目文件所在的文件夹）

- 输入启动命令./gotab-server

- 确认

- 访问 ip+端口打开页面，首次将跳转到/install 安装引导页面，按要求输入内容即可

<img src="https://github.com/user-attachments/assets/de93184b-dc22-4aee-a98c-8316f5dcfef3" width="400" alt="1panel示例">

### 4. 宝塔示例

<img src="https://github.com/user-attachments/assets/16fada89-84d5-45e4-bafc-7761e8542f8a" width="400" alt="宝塔示例">

## 详细展示

> **页面预览**

![20250511193208](https://github.com/user-attachments/assets/9e9d7ce4-e63f-4ec6-a319-b3afb538fe83)

![20250511193251](https://github.com/user-attachments/assets/a6bc5871-80d5-412c-9b65-6345e563d5df)

![20250511193312](https://github.com/user-attachments/assets/a1b34288-b356-44b1-8789-3736db4eaa2e)

> **功能特性**

GoTab 新标签页是 funtabs 新标签页的全新升级版本，是您打造个人学习工作台的浏览器必备插件。简单、无广告、美观大气，超高自定义程度，满足您的各项要求！。

特色功能说明：

- 精美小组件

  ⚬ 独特的小组件设计让信息展示充满美感

  ⚬ 支持众多小组件供您自由选择！

- 聚合搜索

  ⚬ 聚合多个主流搜索引擎，支持一键快捷切换搜索

  ⚬ 搜索支持群搜模式，一次点击打开多个搜索页面

- 浏览器书签管理

  ⚬ 支持批量导入本地书签，方便一键管理

- 排序方式

  ⚬ 支持常规排序、交换位置排序以及自由拖拽多种方式

  ⚬ 相同大小的卡片交换位置，不影响其他卡片布局

  ⚬ 全屏自由拖拽，支持卡片放置在任意位置

  ⚬ 自由拖拽支持移动步长设置，可调整横向、纵向移动网格

- 卡片布局

  ⚬ 任意添加喜欢的卡片，卡片支持内网链接设置

  ⚬ 链接卡片支持纯图、文本、横向卡片、竖向卡片多种样式

  ⚬ 卡片名称支持字幕滚动样式

  ⚬ 分类切换支持滚动翻页、循环滚动等多种模式

  ⚬ 究极超自定义程度，等待您的探索

- 精美动画

  ⚬ 舒适的动画，让您切换自如，感受丝滑

- 双壁纸模式

  ⚬ 支持标准模式和简约模式双壁纸设置

  ⚬ 自定义自定义静态、动态、纯色以及渐变壁纸

  ⚬ 两种模式，两张壁纸，动态切换，随心所欲

- 简约模式

  ⚬ 点击时间一键切换极简模式，享受纯净壁纸界面

  ⚬ 简约模式支持文本设置等多种自定义选项

- 多端数据即时同步与备份

  ⚬ 支持时光机，数据安全不丢失

  ⚬ 支持多设备登录和即时数据同步

  ⚬ 支持数据本地备份，离线也能用

- 资源库

  ⚬ 内置精心整理的全球海量优质网站资源图标库

  ⚬ 支持提交分享您觉得不错的网站资源

- 迁移备份

  ⚬ 支持导入、导出本站数据，管理随心

  ⚬ 导入本地书签，一键添加省心省力

  ⚬ 支持他人标签页导出数据迁移至当前标签页

  ⚬ 不喜欢我们，也可以导出成浏览器书签通用格式

- 丝滑流畅的用户体验

  ⚬ 超快的打开响应速度

  ⚬ 丝滑流畅的动画效果

> **捐赠支持**

<div style="display:flex;flex-wrap:wrap;gap:12px;">

<img src="https://github.com/user-attachments/assets/7c379a17-475d-432f-944e-292f39e0e0ba" width="200" alt="微信支付二维码">

<img src="https://github.com/user-attachments/assets/e3681a43-aec3-4601-a1dd-272c83145e85" width="200" alt="支付宝二维码">

<img src="https://github.com/user-attachments/assets/3423b752-efbd-4fb4-b330-402276d645d1" width="200" alt="微信图片">

</div>
