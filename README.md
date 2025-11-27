# Manchester Triage App

Aplicativo mobile para triagem de pacientes em unidades de emergência utilizando o Protocolo Manchester.

## 📚 Documentação

- **[Informações do Produto](./INFORMACOES_PRODUTO.md)** - Informações técnicas e detalhes do software
- **[Manual de Instalação e Uso](./MANUAL_INSTALACAO_E_USO.md)** - Guia completo de instalação, configuração e uso

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Java JDK 17+
- Android SDK
- Backend Laravel rodando

### Instalação

```bash
# Instalar dependências
npm install

# Configurar Android SDK
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# Configurar URL da API (editar app.json manualmente)
# Edite app.json e atualize a URL em "extra.API_URL"

# Gerar APK
cd android
./gradlew assembleDebug
```

Para mais detalhes, consulte o [Manual de Instalação e Uso](./MANUAL_INSTALACAO_E_USO.md).

## 🏗️ Estrutura do Projeto

```
src/
├── components/     # Componentes React Native
├── screens/        # Telas do aplicativo
├── services/       # Serviços de API
├── context/        # Contextos React
├── navigation/     # Configuração de navegação
├── hooks/          # Custom hooks
└── utils/          # Utilitários
```

## 📄 Licença

Projeto privado.

