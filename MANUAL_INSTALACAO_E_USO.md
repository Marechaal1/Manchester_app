# 4. MANUAL

## 4.1 Pré-Requisitos

### 4.1.1 Sistema Operacional

**Para Desenvolvimento e Build:**
- **Linux** (Ubuntu 20.04+ ou Debian 11+ recomendado)
- **Windows 10/11** (com WSL2 ou ambiente virtualizado)
- **macOS 11+** (para desenvolvimento iOS)

**Para Execução do Aplicativo:**
- **Android:** Android 6.0 (API 23) ou superior
- **iOS:** iOS 12.0 ou superior (se desenvolvido para iOS)

### 4.1.2 Recursos de Hardware

**Mínimo Recomendado para Desenvolvimento:**
- **CPU:** Processador de 64 bits, 2+ núcleos
- **RAM:** 8 GB (16 GB recomendado)
- **Armazenamento:** 20 GB de espaço livre
- **Rede:** Conexão à internet para download de dependências

**Para Build com Docker:**
- **RAM:** 6 GB mínimo (configurado no docker-compose.yml)
- **CPU:** 2.0 cores mínimo

### 4.1.3 Software Base

#### Node.js e npm
- **Node.js:** Versão 18.0.0 ou superior
- **npm:** Versão 9.0.0 ou superior (incluído com Node.js)

#### Java Development Kit (JDK)
- **Java JDK:** Versão 17 ou superior
- **OpenJDK 17** recomendado

#### Android SDK
- **Android SDK Platform:** API 33 (Android 13) ou superior
- **Android SDK Build-Tools:** Versão 33.0.0 ou superior
- **Android SDK Command-line Tools:** Última versão

#### Docker e Docker Compose (Opcional - Método Alternativo)
- **Docker:** Versão 20.10 ou superior
- **Docker Compose:** Versão 2.0 ou superior

#### Git
- **Git:** Versão 2.30 ou superior

### 4.1.4 Backend (Requisito Externo)

O aplicativo requer um backend Laravel rodando e acessível via rede:

- **Backend Laravel:** Versão 9.x ou superior
- **Banco de Dados:** MySQL 8.0 ou superior
- **Servidor Web:** Nginx ou Apache (configurado no Docker)
- **PHP:** Versão 8.1 ou superior

**Configuração do Backend:**
- O backend deve estar rodando em Docker
- Porta padrão: 8080 (configurável)
- API REST disponível em `/api`
- CORS configurado para aceitar requisições do app mobile

### 4.1.5 Linguagens e Frameworks

**Frontend Mobile:**
- **JavaScript (ES6+)** / **TypeScript**
- **React:** Versão 19.1.0
- **React Native:** Versão 0.81.4
- **Expo:** Versão 54.0.12

**Backend:**
- **PHP:** Versão 8.1+
- **Laravel:** Framework PHP

**Build Tools:**
- **Gradle:** Versão 7.5+ (gerenciado automaticamente)
- **Babel:** Versão 7.25.2
- **Metro Bundler:** Incluído com React Native

### 4.1.6 Compiladores e Ferramentas

- **Gradle:** Gerenciador de build Android (incluído no projeto)
- **Babel:** Transpilador JavaScript
- **ESLint:** Linter JavaScript (opcional)
- **Prettier:** Formatador de código (opcional)

### 4.1.7 Variáveis de Ambiente Necessárias

```bash
# Android SDK
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Java
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
```

---

## 4.2 Instalação

### 4.2.1 Método 1: Instalação Tradicional (Recomendado para Desenvolvimento)

#### Passo 1: Instalar Node.js e npm

**Opção A: Usando NVM (Recomendado)**

```bash
# Baixar e instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Recarregar configurações do shell
source ~/.bashrc  # ou source ~/.zshrc

# Instalar Node.js 18
nvm install 18
nvm use 18

# Verificar instalação
node --version  # Deve mostrar v18.x ou superior
npm --version
```

**Opção B: Instalação Direta (Ubuntu/Debian)**

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

#### Passo 2: Instalar Java JDK 17

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y openjdk-17-jdk

# Verificar instalação
java -version  # Deve mostrar openjdk version "17.x"

# Configurar JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

#### Passo 3: Instalar Android SDK

**Opção A: Via Android Studio (Recomendado para Iniciantes)**

```bash
# Instalar Android Studio via snap (Ubuntu)
sudo snap install android-studio --classic

# Ou via apt (se disponível no repositório)
# Após instalar, abrir Android Studio e ir em Tools > SDK Manager
# Instalar: Android SDK Platform 33+, Build-Tools, Command-line Tools
# Anotar o caminho do SDK (geralmente: ~/Android/Sdk)
```

**Opção B: Via Linha de Comando**

```bash
# Criar diretório para Android SDK
mkdir -p ~/android-sdk
cd ~/android-sdk

# Baixar command-line tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-*.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true

# Configurar variáveis de ambiente
export ANDROID_HOME=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Instalar SDK
sdkmanager --install "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

#### Passo 4: Configurar Variáveis de Ambiente Permanentemente

Adicionar ao arquivo `~/.bashrc` ou `~/.zshrc`:

```bash
# Android SDK
export ANDROID_HOME=$HOME/android-sdk  # ou /home/seu_usuario/Android/Sdk se instalou via Android Studio
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Java
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
```

Aplicar as mudanças:

```bash
source ~/.bashrc  # ou source ~/.zshrc
```

#### Passo 5: Clonar o Repositório

```bash
# Navegar para o diretório desejado
cd ~

# Clonar o repositório (substitua pela URL real)
git clone <URL_DO_REPOSITORIO> Manchester_app

# Entrar no diretório
cd Manchester_app
```

#### Passo 6: Instalar Dependências do Node.js

```bash
# Garantir que está no diretório do projeto
cd ~/Manchester_app

# Instalar dependências
npm install

# Isso pode levar alguns minutos...
```

**Verificar instalação:**

```bash
# Verificar se as dependências foram instaladas
ls node_modules | head -10

# Verificar se o Expo CLI está disponível
npx expo --version
```

#### Passo 7: Configurar Android SDK no Projeto

```bash
cd ~/Manchester_app/android

# Criar arquivo local.properties
cat > local.properties << EOF
sdk.dir=$ANDROID_HOME
EOF

# Verificar
cat local.properties

# Dar permissão de execução ao Gradle
chmod +x gradlew
```

**Se você instalou via Android Studio**, o caminho pode ser:
```properties
sdk.dir=/home/seu_usuario/Android/Sdk
```

#### Passo 8: Configurar Backend

**Verificar se o Backend está Rodando:**

```bash
# Verificar se o Docker está rodando
docker ps

# Se o backend estiver em outro diretório, navegue até ele
cd ~/ManchesterTriageBackend  # Ajuste o caminho conforme necessário

# Verificar se os containers estão rodando
docker compose ps

# Se não estiver rodando, inicie:
docker compose up -d
```

**Descobrir IP do Backend:**

```bash
# Método 1: Usando hostname
hostname -I | awk '{print $1}'

# Método 2: Usando ip
ip route get 1.1.1.1 | awk '{print $7}'

# Método 3: Verificar todas as interfaces
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Anote o IP encontrado!** Exemplo: `192.168.0.102`

#### Passo 9: Configurar App para Apontar ao Backend

Edite o arquivo `app.json`:

```bash
cd ~/Manchester_app
nano app.json  # ou use seu editor preferido
```

Localize a seção `extra` e atualize o `API_URL`:

```json
{
  "expo": {
    "extra": {
      "API_URL": "http://192.168.0.102:8080/api"
    }
  }
}
```

**Substitua `192.168.0.102` pelo IP que você descobriu no passo 8.**

**Verificar configuração:**

```bash
# Verificar se a URL foi atualizada corretamente
grep "API_URL" app.json
```

#### Passo 10: Gerar o APK

**APK de Desenvolvimento (Debug):**

```bash
cd ~/Manchester_app/android
./gradlew assembleDebug
```

O APK será gerado em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**APK de Produção (Release):**

```bash
cd ~/Manchester_app/android
./gradlew assembleRelease
```

O APK será gerado em:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Passo 11: Instalar no Dispositivo

**Via ADB (Android Debug Bridge):**

1. **Preparar o dispositivo:**
   - Habilitar Modo Desenvolvedor: Configurações > Sobre o telefone > Toque 7 vezes em "Número da versão"
   - Habilitar Depuração USB: Configurações > Opções do desenvolvedor > Depuração USB
   - Conectar dispositivo via USB

2. **Instalar APK:**

```bash
# Verificar se o dispositivo está conectado
adb devices

# Instalar APK debug
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Se já tiver o app instalado, usar -r para reinstalar
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**Via Transferência de Arquivo:**

1. Copiar APK para o dispositivo via USB ou rede
2. No dispositivo Android, abrir o gerenciador de arquivos
3. Navegar até o APK e tocar para instalar
4. Permitir instalação de fontes desconhecidas se solicitado

---

### 4.2.2 Método 2: Instalação com Docker (Recomendado para Build)

Este método não requer instalação de Node.js, Java ou Android SDK na máquina host.

#### Pré-requisitos

Apenas **Docker** e **Docker Compose** instalados.

**Instalar Docker:**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose

# Iniciar serviço Docker
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar usuário ao grupo docker (para não precisar de sudo)
sudo usermod -aG docker $USER

# Fazer logout e login novamente para aplicar mudanças
```

#### Passo 1: Construir Imagem Docker

```bash
cd ~/Manchester_app

# Construir imagem (primeira vez, ~15 min)
docker-compose build
```

#### Passo 2: Instalar Dependências

```bash
# Instalar dependências do Node.js dentro do container
docker-compose run --rm builder npm install
```

#### Passo 3: Gerar APK

```bash
# Entrar no container
docker-compose run --rm builder bash

# Dentro do container, gerar APK debug
cd android
./gradlew assembleDebug

# Ou gerar APK release
./gradlew assembleRelease

# Sair do container
exit
```

**O APK estará em:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

### 4.2.3 Verificação da Instalação

**Checklist Final:**

- [ ] Node.js 18+ instalado e funcionando
- [ ] Java JDK 17+ instalado e funcionando
- [ ] Android SDK instalado e `ANDROID_HOME` configurado
- [ ] Repositório clonado
- [ ] `npm install` executado com sucesso
- [ ] `local.properties` criado em `android/`
- [ ] Backend Docker rodando e acessível
- [ ] IP do backend descoberto
- [ ] `app.json` configurado com o IP correto
- [ ] APK gerado com sucesso
- [ ] APK instalado no dispositivo
- [ ] App conecta ao backend corretamente

**Testar Conexão com Backend:**

```bash
# Substitua pelo IP encontrado
IP_BACKEND="192.168.0.102"
PORTA_BACKEND="8080"

# Testar se o backend está acessível
curl http://${IP_BACKEND}:${PORTA_BACKEND}/api

# Ou testar apenas a conexão
curl -I http://${IP_BACKEND}:${PORTA_BACKEND}/api
```

---

## 4.3 Manual do Software

### 4.3.1 Visão Geral

O **Manchester Triage App** é um aplicativo mobile desenvolvido para auxiliar profissionais de saúde na triagem e classificação de risco de pacientes em unidades de emergência, utilizando o Protocolo Manchester.

### 4.3.2 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICATIVO MOBILE                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React      │  │   React      │  │   React       │     │
│  │   Native     │  │  Navigation  │  │   Context    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              HTTP Client (Axios)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND LARAVEL                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Laravel    │  │   MySQL      │  │   Nginx      │     │
│  │   Framework  │  │   Database   │  │   Server     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 4.3.3 Atores do Sistema

#### 4.3.3.1 Administrador

**Descrição:** Usuário com acesso total ao sistema, responsável pela gestão de usuários e configurações.

**Permissões:**
- ✅ Gerenciar usuários (criar, editar, desativar)
- ✅ Configurar parâmetros do sistema
- ✅ Visualizar todos os pacientes
- ✅ Acessar relatórios
- ✅ Configurar tempos de reavaliação
- ✅ Gerenciar catálogos (CIPE, NOC)

**Credenciais Padrão (após seed):**
- Email: `admin@sistema.com`
- Senha: `123456`

#### 4.3.3.2 Enfermeiro

**Descrição:** Profissional responsável pela triagem inicial, reavaliação e registro de SAE.

**Permissões:**
- ✅ Realizar triagem de novos pacientes
- ✅ Classificar risco conforme Protocolo Manchester
- ✅ Registrar dados clínicos e sinais vitais
- ✅ Realizar reavaliação de pacientes
- ✅ Registrar SAE (Sistematização da Assistência de Enfermagem)
- ✅ Visualizar pacientes triados
- ✅ Registrar procedimentos internos
- ✅ Liberar pacientes

**Credenciais Padrão (após seed):**
- Email: `enfermeiro@sistema.com`
- Senha: `123456`

#### 4.3.3.3 Médico

**Descrição:** Profissional responsável pelo atendimento médico e observação de pacientes.

**Permissões:**
- ✅ Visualizar pacientes triados
- ✅ Iniciar atendimento médico
- ✅ Registrar evolução médica
- ✅ Solicitar exames
- ✅ Prescrever medicamentos
- ✅ Definir conduta (alta, internação, encaminhamento)
- ✅ Visualizar pacientes em atendimento
- ✅ Acessar relatórios

**Credenciais Padrão (após seed):**
- Email: `medico@sistema.com`
- Senha: `123456`

### 4.3.4 Módulos do Sistema

#### 4.3.4.1 Módulo de Autenticação

**Funcionalidades:**
- Login de usuários
- Logout
- Validação de credenciais
- Armazenamento seguro de token
- Verificação de sessão

**Telas:**
- **TelaLogin:** Tela inicial do aplicativo para autenticação

**Fluxo:**
```
Usuário → Informa email/senha → Backend valida → Retorna token → App armazena token → Acesso liberado
```

#### 4.3.4.2 Módulo de Dashboard

**Funcionalidades:**
- Visualização de pacientes triados
- Filtros por classificação de risco
- Estatísticas de pacientes
- Alertas de reavaliação
- Navegação para outras telas

**Telas:**
- **TelaDashboard:** Tela principal com lista de pacientes e estatísticas

**Classificações de Risco (Protocolo Manchester):**
- 🔴 **Vermelho (Emergência):** 0-10 minutos
- 🟠 **Laranja (Muito Urgente):** 10-60 minutos
- 🟡 **Amarelo (Urgente):** 60-240 minutos
- 🟢 **Verde (Padrão):** 240+ minutos
- 🔵 **Azul (Não Urgente):** Até 24 horas

#### 4.3.4.3 Módulo de Triagem

**Funcionalidades:**
- Cadastro de novo paciente
- Registro de dados clínicos
- Registro de sinais vitais
- Avaliação de segurança
- Classificação de risco

**Telas:**
- **TelaNovoPaciente:** Tela de triagem com 3 etapas:
  1. Dados Clínicos (sinais vitais, sintomas, histórico)
  2. Segurança (alergias, comorbidades, medicamentos)
  3. Classificação (risco e justificativa)

**Dados Coletados:**
- Dados básicos: CPF, Nome, Data de nascimento
- Sinais vitais: Pressão arterial, Frequência cardíaca, Temperatura, Frequência respiratória, Saturação de oxigênio
- Antropometria: Peso, Altura
- Sintomas e histórico médico
- Alergias
- Comorbidades
- Medicamentos crônicos
- Pacientes de risco especial

#### 4.3.4.4 Módulo de Reavaliação

**Funcionalidades:**
- Reavaliação de pacientes já triados
- Atualização de sinais vitais
- Nova classificação de risco
- Registro de evolução

**Telas:**
- **TelaReavaliacao:** Tela para reavaliar pacientes conforme tempo configurado

**Alertas:**
- Notificações quando paciente precisa de reavaliação
- Alertas visuais no dashboard
- Cores indicando urgência (vermelho = atrasado, amarelo = próximo do prazo)

#### 4.3.4.5 Módulo de SAE (Sistematização da Assistência de Enfermagem)

**Funcionalidades:**
- Registro de diagnósticos de enfermagem (CIPE)
- Registro de intervenções de enfermagem (CIPE)
- Registro de resultados esperados (NOC)
- Evolução de enfermagem
- Visualização de SAE anterior

**Telas:**
- **TelaSAE:** Tela para registro completo de SAE com múltiplas etapas
- **TelaVisualizarSAE:** Tela para visualizar SAE registrado anteriormente

**Etapas do SAE:**
1. Dados Clínicos
2. Diagnóstico de Enfermagem
3. Intervenções de Enfermagem
4. Resultados Esperados
5. Evolução de Enfermagem

#### 4.3.4.6 Módulo de Atendimento Médico

**Funcionalidades:**
- Iniciar atendimento médico
- Registrar anamnese
- Registrar exame físico
- Registrar diagnósticos médicos
- Solicitar exames
- Prescrever medicamentos
- Definir conduta
- Finalizar atendimento

**Telas:**
- **TelaAtendimentoMedico:** Tela completa de atendimento médico com múltiplas etapas

**Etapas do Atendimento:**
1. Anamnese
2. Exame Físico
3. Diagnósticos
4. Exames Solicitados
5. Prescrições
6. Conduta

#### 4.3.4.7 Módulo de Gerenciamento de Pacientes

**Funcionalidades:**
- Listar todos os pacientes
- Buscar pacientes
- Visualizar detalhes do paciente
- Ver histórico completo
- Editar informações

**Telas:**
- **TelaGerenciarPacientes:** Tela para gerenciar e buscar pacientes

#### 4.3.4.8 Módulo de Procedimentos Internos

**Funcionalidades:**
- Registrar procedimentos realizados
- Atualizar status do paciente
- Registrar observações

**Telas:**
- **TelaProcedimentosInternos:** Tela para registro de procedimentos

#### 4.3.4.9 Módulo de Liberação de Pacientes

**Funcionalidades:**
- Liberar paciente do sistema
- Registrar motivo da liberação
- Finalizar fluxo do paciente

**Telas:**
- **TelaLiberarPaciente:** Tela para liberar paciente

### 4.3.5 Fluxos Principais

#### 4.3.5.1 Fluxo de Triagem (Enfermeiro)

```
1. Login → Dashboard
2. Dashboard → Novo Paciente
3. Etapa 1: Dados Clínicos
   - Preencher sinais vitais
   - Registrar sintomas
   - Informar histórico médico
4. Etapa 2: Segurança
   - Informar alergias
   - Informar comorbidades
   - Informar medicamentos
5. Etapa 3: Classificação
   - Selecionar classificação de risco
   - Justificar classificação
6. Finalizar → Paciente aparece no Dashboard
```

#### 4.3.5.2 Fluxo de Atendimento Médico

```
1. Login → Dashboard
2. Dashboard → Selecionar paciente triado
3. Iniciar Atendimento
4. Preencher Anamnese
5. Preencher Exame Físico
6. Registrar Diagnósticos
7. Solicitar Exames
8. Prescrever Medicamentos
9. Definir Conduta
10. Finalizar Atendimento
```

#### 4.3.5.3 Fluxo de SAE

```
1. Login → Dashboard
2. Dashboard → Selecionar paciente
3. Iniciar SAE
4. Etapa 1: Dados Clínicos
5. Etapa 2: Diagnóstico de Enfermagem (CIPE)
6. Etapa 3: Intervenções (CIPE)
7. Etapa 4: Resultados Esperados (NOC)
8. Etapa 5: Evolução de Enfermagem
9. Finalizar SAE
```

### 4.3.6 Requisitos Funcionais

#### RF01 - Autenticação
- O sistema deve permitir login com email e senha
- O sistema deve validar credenciais no backend
- O sistema deve manter sessão ativa enquanto o token for válido
- O sistema deve permitir logout

#### RF02 - Triagem
- O sistema deve permitir cadastro de novo paciente
- O sistema deve coletar dados clínicos completos
- O sistema deve permitir classificação de risco conforme Protocolo Manchester
- O sistema deve validar dados obrigatórios antes de finalizar

#### RF03 - Classificação de Risco
- O sistema deve permitir classificação em 5 níveis (vermelho, laranja, amarelo, verde, azul)
- O sistema deve exibir cores correspondentes à classificação
- O sistema deve calcular tempo de espera baseado na classificação

#### RF04 - Reavaliação
- O sistema deve alertar quando paciente precisa de reavaliação
- O sistema deve permitir reavaliação de pacientes
- O sistema deve atualizar classificação de risco na reavaliação

#### RF05 - SAE
- O sistema deve permitir registro completo de SAE
- O sistema deve utilizar catálogos CIPE e NOC
- O sistema deve permitir visualização de SAE anterior

#### RF06 - Atendimento Médico
- O sistema deve permitir iniciar atendimento médico
- O sistema deve coletar anamnese e exame físico
- O sistema deve permitir solicitar exames e prescrever medicamentos
- O sistema deve permitir definir conduta

#### RF07 - Dashboard
- O sistema deve exibir lista de pacientes triados
- O sistema deve permitir filtrar por classificação de risco
- O sistema deve exibir estatísticas de pacientes
- O sistema deve exibir alertas de reavaliação

#### RF08 - Notificações
- O sistema deve enviar notificações de reavaliação
- O sistema deve alertar sobre pacientes críticos

### 4.3.7 Requisitos Não Funcionais

#### RNF01 - Performance
- O aplicativo deve carregar telas em menos de 2 segundos
- O aplicativo deve responder a ações do usuário em menos de 1 segundo
- O aplicativo deve funcionar offline parcialmente (cache de dados)

#### RNF02 - Usabilidade
- O aplicativo deve ter interface intuitiva
- O aplicativo deve ter navegação clara entre telas
- O aplicativo deve ter formulários otimizados para teclado mobile

#### RNF03 - Segurança
- O aplicativo deve usar HTTPS para comunicação (em produção)
- O aplicativo deve armazenar tokens de forma segura
- O aplicativo deve validar permissões de usuário

#### RNF04 - Compatibilidade
- O aplicativo deve funcionar em Android 6.0+
- O aplicativo deve funcionar em diferentes tamanhos de tela
- O aplicativo deve funcionar em modo retrato e paisagem

#### RNF05 - Confiabilidade
- O aplicativo deve tratar erros de conexão
- O aplicativo deve validar dados antes de enviar
- O aplicativo deve exibir mensagens de erro claras

### 4.3.8 Diagrama de Casos de Uso

```
┌─────────────────────────────────────────────────────────────┐
│                        SISTEMA                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Administrador│  │  Enfermeiro  │  │    Médico    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         │                  │                  │              │
│    ┌────▼──────────────────▼──────────────────▼────┐      │
│    │            Fazer Login                         │      │
│    └────────────────────────────────────────────────┘      │
│                                                              │
│    ┌────────────────────────────────────────────────┐      │
│    │  Realizar Triagem (Enfermeiro)                  │      │
│    └────────────────────────────────────────────────┘      │
│                                                              │
│    ┌────────────────────────────────────────────────┐      │
│    │  Reavaliar Paciente (Enfermeiro)               │      │
│    └────────────────────────────────────────────────┘      │
│                                                              │
│    ┌────────────────────────────────────────────────┐      │
│    │  Registrar SAE (Enfermeiro)                     │      │
│    └────────────────────────────────────────────────┘      │
│                                                              │
│    ┌────────────────────────────────────────────────┐      │
│    │  Atender Paciente (Médico)                      │      │
│    └────────────────────────────────────────────────┘      │
│                                                              │
│    ┌────────────────────────────────────────────────┐      │
│    │  Gerenciar Usuários (Administrador)             │      │
│    └────────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3.9 Guia de Uso Rápido

#### Para Enfermeiros:

1. **Fazer Login:**
   - Abrir aplicativo
   - Informar email: `enfermeiro@sistema.com`
   - Informar senha: `123456`
   - Tocar em "Entrar"

2. **Realizar Triagem:**
   - No Dashboard, tocar em "Novo Paciente"
   - Preencher dados clínicos (Etapa 1)
   - Preencher dados de segurança (Etapa 2)
   - Classificar risco (Etapa 3)
   - Tocar em "Finalizar"

3. **Reavaliar Paciente:**
   - No Dashboard, localizar paciente com alerta de reavaliação
   - Tocar no card do paciente
   - Selecionar "Reavaliar"
   - Atualizar dados e classificação
   - Salvar

4. **Registrar SAE:**
   - No Dashboard, selecionar paciente
   - Tocar em "SAE"
   - Preencher todas as etapas
   - Finalizar

#### Para Médicos:

1. **Fazer Login:**
   - Abrir aplicativo
   - Informar email: `medico@sistema.com`
   - Informar senha: `123456`
   - Tocar em "Entrar"

2. **Atender Paciente:**
   - No Dashboard, selecionar paciente triado
   - Tocar em "Iniciar Atendimento"
   - Preencher anamnese
   - Preencher exame físico
   - Registrar diagnósticos
   - Solicitar exames e prescrever
   - Definir conduta
   - Finalizar atendimento

### 4.3.10 Solução de Problemas Comuns

#### Problema: "Não foi possível conectar ao servidor"

**Solução:**
1. Verificar se o backend está rodando
2. Verificar se o IP está correto no `app.json`
3. Verificar se o dispositivo está na mesma rede Wi-Fi
4. Verificar firewall

#### Problema: "Usuário não tem permissão"

**Solução:**
1. Verificar tipo de usuário no backend
2. Verificar se o usuário está ativo
3. Fazer logout e login novamente

#### Problema: "APK não instala"

**Solução:**
1. Habilitar instalação de fontes desconhecidas
2. Verificar se há espaço suficiente no dispositivo
3. Tentar desinstalar versão anterior primeiro

---

**Versão do Manual:** 1.0  
**Data:** 27/11/2025  
**Aplicativo:** Manchester Triage App v1.0.0

