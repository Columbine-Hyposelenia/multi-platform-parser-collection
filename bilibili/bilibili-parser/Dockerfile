# 使用 Node.js 运行应用
FROM node:18

# 安装系统依赖和 yt-dlp
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && pip3 install --break-system-packages yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用文件
COPY server.js ./
COPY services ./services
COPY public ./public

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]

