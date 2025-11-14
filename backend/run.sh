#!/bin/bash
set -e

# Script para rodar o backend Go
# Workaround para problema de IPv6 no Replit com Supabase

echo "🚀 Iniciando backend Go..."
echo "📝 Nota: Usando workaround IPv4 para conectar ao Supabase"

# Rodar o backend Go com GODEBUG configurado
cd "$(dirname "$0")"
export GODEBUG="netdns=go+1"
exec go run main.go
