# Dockerfile para gerar APK do Manchester Triage App
# Esta imagem contém todos os pré-requisitos: Node.js, Java, Android SDK, etc.

FROM ubuntu:22.04

# Evitar prompts interativos durante instalação
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Sao_Paulo

# Variáveis de ambiente
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin
ENV PATH=${PATH}:${ANDROID_HOME}/platform-tools
ENV PATH=${PATH}:${ANDROID_HOME}/tools
ENV PATH=${PATH}:${ANDROID_HOME}/tools/bin
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=${PATH}:${JAVA_HOME}/bin

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    build-essential \
    openjdk-17-jdk \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Instalar Node.js 18 via NodeSource (mais confiável para Docker)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Verificar instalação
RUN node --version && npm --version

# Criar diretório para Android SDK
RUN mkdir -p ${ANDROID_HOME} && \
    chmod 777 ${ANDROID_HOME}

# Baixar e instalar Android Command Line Tools
RUN cd /tmp && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip && \
    unzip -q commandlinetools-linux-*.zip && \
    mkdir -p ${ANDROID_HOME}/cmdline-tools/latest && \
    mv cmdline-tools/* ${ANDROID_HOME}/cmdline-tools/latest/ && \
    rm -rf /tmp/*

# Aceitar licenças e instalar componentes do Android SDK
RUN yes | sdkmanager --licenses || true

# Instalar componentes do Android SDK necessários
RUN sdkmanager \
    "platform-tools" \
    "platforms;android-33" \
    "platforms;android-34" \
    "build-tools;33.0.0" \
    "build-tools;34.0.0" \
    "ndk;25.1.8937393" \
    "cmake;3.22.1"

# Configurar permissões
RUN chmod -R 755 ${ANDROID_HOME}

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos do projeto (será feito via volume, mas útil para cache)
COPY package*.json ./

# Limpar cache do npm (npm já vem com versão compatível)
RUN npm cache clean --force

# Definir usuário não-root (opcional, mas recomendado)
RUN useradd -m -s /bin/bash appuser && \
    chown -R appuser:appuser /app

# Expor porta (se necessário para desenvolvimento)
EXPOSE 8081 19000 19001 19002

# Script de entrada padrão
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Comando padrão
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["help"]

