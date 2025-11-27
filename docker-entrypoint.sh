#!/bin/bash

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Manchester Triage App - Docker Build Environment${NC}"
echo "=========================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este container montando o diretório do projeto"
    echo "   Exemplo: docker run -v \$(pwd):/app ..."
    exit 1
fi

# Função para mostrar ajuda
show_help() {
    echo "Comandos disponíveis:"
    echo ""
    echo "  install          - Instalar dependências do Node.js"
    echo "  build:debug      - Gerar APK de desenvolvimento (debug)"
    echo "  build:release    - Gerar APK de produção (release)"
    echo "  build:auto       - Script automatizado (detecta IP e gera APK)"
    echo "  update-api       - Atualizar URL da API no app.json"
    echo "  shell            - Abrir shell interativo"
    echo "  help             - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  docker-compose run --rm builder install"
    echo "  docker-compose run --rm builder build:debug"
    echo "  docker-compose run --rm builder build:auto"
}

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules não encontrado. Execute 'install' primeiro.${NC}"
    echo ""
fi

# Processar comando
case "$1" in
    install)
        echo "📦 Instalando dependências do Node.js..."
        npm install
        echo "✅ Dependências instaladas!"
        ;;
    
    build:debug)
        echo "🔨 Gerando APK de desenvolvimento (debug)..."
        cd android
        # Usar --no-daemon para evitar crashes no Docker
        ./gradlew assembleDebug --no-daemon --max-workers=2
        echo ""
        echo "✅ APK gerado em: android/app/build/outputs/apk/debug/app-debug.apk"
        ;;
    
    build:release)
        echo "🔨 Gerando APK de produção (release)..."
        cd android
        # Usar --no-daemon para evitar crashes no Docker
        ./gradlew assembleRelease --no-daemon --max-workers=2
        echo ""
        echo "✅ APK gerado em: android/app/build/outputs/apk/release/app-release.apk"
        ;;
    
    build:auto)
        echo "🤖 Executando build automatizado..."
        if [ -f "build-apk.sh" ]; then
            chmod +x build-apk.sh
            ./build-apk.sh
        else
            echo "❌ Script build-apk.sh não encontrado"
            exit 1
        fi
        ;;
    
    update-api)
        echo "⚙️  Atualizando URL da API..."
        if [ -f "update-api-url.sh" ]; then
            chmod +x update-api-url.sh
            ./update-api-url.sh
        else
            echo "❌ Script update-api-url.sh não encontrado"
            exit 1
        fi
        ;;
    
    shell)
        echo "🐚 Abrindo shell interativo..."
        exec /bin/bash
        ;;
    
    help|--help|-h|"")
        show_help
        ;;
    
    *)
        echo "❌ Comando desconhecido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

