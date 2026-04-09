#!/bin/bash
# =============================================================================
# SaaS Inmobiliario — Script de Validación
# Verifica que el entorno está configurado correctamente
#
# Uso: ./scripts/validate.sh
# =============================================================================

set -e

# ── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── Contadores ───────────────────────────────────────────────────────────────
PASSED=0
FAILED=0
WARNINGS=0

# ── Helpers ──────────────────────────────────────────────────────────────────
check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

section() {
    echo ""
    echo -e "${BLUE}━━━ $1 ━━━${NC}"
}

# ── Inicio ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SaaS Inmobiliario — Validación de Entorno     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Verificar Node.js ────────────────────────────────────────────────────
section "1. Node.js"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | tr -d 'v')
    
    if [ "$NODE_MAJOR" -ge 20 ]; then
        check_pass "Node.js $NODE_VERSION (>= 20 requerido)"
    else
        check_fail "Node.js $NODE_VERSION — se requiere >= 20"
    fi
else
    check_fail "Node.js no encontrado"
fi

if command -v npm &> /dev/null; then
    check_pass "npm $(npm --version)"
else
    check_fail "npm no encontrado"
fi

# ── 2. Verificar Docker ─────────────────────────────────────────────────────
section "2. Docker"

if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        check_pass "Docker está corriendo"
    else
        check_warn "Docker está instalado pero no está corriendo"
    fi
else
    check_warn "Docker no encontrado (opcional para desarrollo)"
fi

if command -v docker compose &> /dev/null || command -v docker-compose &> /dev/null; then
    check_pass "Docker Compose disponible"
else
    check_warn "Docker Compose no encontrado (opcional para desarrollo)"
fi

# ── 3. Verificar PostgreSQL ─────────────────────────────────────────────────
section "3. PostgreSQL"

if command -v psql &> /dev/null; then
    check_pass "psql CLI encontrado"
    
    # Verificar conexión (solo si DATABASE_URL está definido)
    if [ -f .env ] && grep -q "DATABASE_URL" .env; then
        DB_HOST=$(grep "DATABASE_URL" .env | sed -E 's/.*@([^:]+):.*/\1/')
        DB_PORT=$(grep "DATABASE_URL" .env | sed -E 's/.*:([0-9]+)\/.*/\1/')
        
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            check_pass "PostgreSQL corriendo en $DB_HOST:$DB_PORT"
        else
            check_warn "No se puede conectar a PostgreSQL en $DB_HOST:$DB_PORT"
        fi
    fi
else
    check_warn "psql no encontrado (usar Docker si no hay Postgres local)"
fi

# ── 4. Verificar archivos de entorno ────────────────────────────────────────
section "4. Archivos de Entorno"

if [ -f .env ]; then
    check_pass ".env existe"
    
    # Verificar variables requeridas
    REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "PORT" "PLATFORM_TENANT_ID")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            check_pass "Variable $var definida"
        else
            check_fail "Variable $var faltante en .env"
        fi
    done
else
    check_fail ".env no existe — copiar de .env.example"
fi

if [ -f .env.example ]; then
    check_pass ".env.example existe"
else
    check_fail ".env.example no encontrado"
fi

# ── 5. Verificar node_modules ───────────────────────────────────────────────
section "5. Dependencias"

if [ -d node_modules ]; then
    check_pass "node_modules existe"
    
    # Verificar paquetes críticos
    CRITICAL_PACKAGES=("express" "prisma" "@prisma/client" "typescript")
    
    for pkg in "${CRITICAL_PACKAGES[@]}"; do
        if [ -d "node_modules/$pkg" ]; then
            check_pass "Paquete $pkg instalado"
        else
            check_fail "Paquete $pkg no encontrado — ejecutar npm install"
        fi
    done
else
    check_fail "node_modules no encontrado — ejecutar npm install"
fi

# ── 6. Verificar Prisma ─────────────────────────────────────────────────────
section "6. Prisma"

if [ -f prisma/schema.prisma ]; then
    check_pass "schema.prisma existe"
    
    # Contar modelos
    MODEL_COUNT=$(grep -c "^model " prisma/schema.prisma || echo 0)
    check_pass "Esquema tiene $MODEL_COUNT modelos"
else
    check_fail "prisma/schema.prisma no encontrado"
fi

# ── 7. Verificar build ──────────────────────────────────────────────────────
section "7. Build de TypeScript"

if [ -d dist ]; then
    check_pass "Directorio dist/ existe"
    
    if [ -f dist/app/server.js ]; then
        check_pass "dist/app/server.js existe (build compilado)"
    else
        check_warn "dist/app/server.js no encontrado — ejecutar npm run build"
    fi
    
    if [ -f dist/openapi.yaml ]; then
        check_pass "dist/openapi.yaml existe (OpenAPI bundle)"
    else
        check_warn "dist/openapi.yaml no encontrado — ejecutar npm run openapi:bundle"
    fi
else
    check_warn "Directorio dist/ no encontrado — ejecutar npm run build"
fi

# ── 8. Verificar Docker Compose ─────────────────────────────────────────────
section "8. Docker Compose"

COMPOSE_FILE="../../docker-compose.yml"

if [ -f "$COMPOSE_FILE" ]; then
    check_pass "docker-compose.yml existe"
    
    # Verificar que tiene los servicios esperados
    if grep -q "postgres:" "$COMPOSE_FILE"; then
        check_pass "Servicio postgres definido"
    else
        check_fail "Servicio postgres no encontrado en docker-compose.yml"
    fi
    
    if grep -q "backend:" "$COMPOSE_FILE"; then
        check_pass "Servicio backend definido"
    else
        check_fail "Servicio backend no encontrado en docker-compose.yml"
    fi
else
    check_fail "docker-compose.yml no encontrado"
fi

# ── 9. Verificar CI ─────────────────────────────────────────────────────────
section "9. CI/CD"

if [ -f .github/workflows/ci.yml ]; then
    check_pass "GitHub Actions CI configurado"
    
    # Verificar jobs esperados
    if grep -q "build:" .github/workflows/ci.yml; then
        check_pass "Job de build definido"
    fi
    
    if grep -q "test:" .github/workflows/ci.yml; then
        check_pass "Job de tests definido"
    fi
    
    if grep -q "docker:" .github/workflows/ci.yml; then
        check_pass "Job de Docker definido"
    fi
else
    check_warn ".github/workflows/ci.yml no encontrado"
fi

# ── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Resultados:"
echo -e "    ${GREEN}✓ Pasados: $PASSED${NC}"
echo -e "    ${RED}✗ Fallidos: $FAILED${NC}"
echo -e "    ${YELLOW}⚠ Advertencias: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "  ${GREEN}Estado: ENTORNO LISTO ✓${NC}"
    echo ""
    echo -e "  Próximos pasos:"
    echo -e "    1. docker compose up -d     (iniciar servicios)"
    echo -e "    2. npm run db:setup         (migrar + seed)"
    echo -e "    3. npm run dev              (iniciar servidor)"
    echo -e "    4. Abrir http://localhost:3000/docs  (Swagger UI)"
    echo ""
    exit 0
else
    echo -e "  ${RED}Estado: CORREGIR ERRORES ANTES DE CONTINUAR${NC}"
    echo ""
    exit 1
fi
