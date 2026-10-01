<#
.SYNOPSIS
  Compilacion de Android para las tiendas (AAB) con EAS en local, dentro de WSL (Ubuntu).

.DESCRIPTION
  Mismo flujo que el proyecto Tanty:
    1. Clona el repositorio en WSL la primera vez; despues trae los ultimos cambios (git pull).
       Compila lo que esta en GitHub: haz push antes de correrlo.
    2. npm ci, para instalar exactamente lo de package-lock.json.
    3. Limpia la carpeta temporal de EAS.
    4. Corre `eas build --local` con el perfil pedido. Las variables EXPO_PUBLIC_* y los
       secretos de Sentry salen de las variables de entorno de EAS del perfil (eas.json),
       no de este archivo. ANDROID_HOME y TMPDIR van en linea: en ~/.bashrc el build local
       falla con "SDK not found" o "No space left on device".
    5. Copia el .aab (y el mapping.txt de R8, si existe) a una carpeta de Windows, numerado.

  Corre con build-android.cmd (doble clic), que deja la ventana abierta al terminar.
  El token de EAS se lee de .env.local (EXPO_TOKEN=...), que no se sube al repositorio.

.PARAMETER Perfil
  Perfil de eas.json: production (por defecto) o preview.
#>
param(
    [string]$Rama = "main",
    [ValidateSet("production", "preview")]
    [string]$Perfil = "production",
    [string]$Distro = "Ubuntu",
    [string]$RepoWsl = "~/tino",
    [string]$UrlRepo = "https://github.com/Andersonpolanco1/tino.git",
    [string]$Salida = "$env:USERPROFILE\Desktop\Tino builds"
)

$ErrorActionPreference = "Stop"
$huboError = $false

try {
    $envLocal = Join-Path $PSScriptRoot "..\..\.env.local"
    if (-not (Test-Path $envLocal)) {
        throw "Falta $envLocal con la linea EXPO_TOKEN=... (token de acceso de expo.dev)."
    }
    $token = (Get-Content $envLocal | Where-Object { $_ -match '^EXPO_TOKEN=' }) -replace '^EXPO_TOKEN=', ''
    if (-not $token) {
        throw "EXPO_TOKEN vacio o no encontrado en $envLocal"
    }

    Write-Host "==> Rama: $Rama | Perfil: $Perfil | WSL: $Distro | Repo: $RepoWsl" -ForegroundColor Cyan

    $comando = @"
set -e
if [ ! -d $RepoWsl/.git ]; then
  echo '--- git clone ---'
  git clone $UrlRepo $RepoWsl
fi
cd $RepoWsl
echo '--- git pull ---'
git fetch origin
git checkout $Rama
git pull origin $Rama
echo '--- npm ci ---'
npm ci
echo '--- limpiando la carpeta temporal de EAS ---'
mkdir -p /home/ander/eas-tmp
rm -rf /home/ander/eas-tmp/*
echo '--- build ---'
export TMPDIR=/home/ander/eas-tmp
export ANDROID_HOME=/home/ander/android-sdk
export ANDROID_SDK_ROOT=/home/ander/android-sdk
export EXPO_TOKEN='$token'
npx eas build --platform android --profile $Perfil --local --non-interactive --output /home/ander/tino-$Perfil.aab
"@

    $inicio = Get-Date
    & wsl.exe -d $Distro -- bash -lc $comando
    $codigo = $LASTEXITCODE
    $minutos = [math]::Round(((Get-Date) - $inicio).TotalMinutes, 1)

    if ($codigo -ne 0) {
        throw "La compilacion fallo (codigo $codigo) despues de $minutos min. Revisa el log de arriba."
    }

    Write-Host "`n==> Compilacion lista en $minutos min. Copiando archivos..." -ForegroundColor Green

    if (-not (Test-Path $Salida)) {
        New-Item -ItemType Directory -Path $Salida | Out-Null
    }
    $existentes = Get-ChildItem -Path $Salida -Filter "Tino-$Perfil-v*.aab" -ErrorAction SilentlyContinue |
        ForEach-Object { if ($_.BaseName -match "^Tino-$Perfil-v(\d+)$") { [int]$Matches[1] } }
    $siguiente = if ($existentes) { ($existentes | Measure-Object -Maximum).Maximum + 1 } else { 1 }

    $aab = Join-Path $Salida "Tino-$Perfil-v$siguiente.aab"
    Copy-Item -Path "\\wsl.localhost\$Distro\home\ander\tino-$Perfil.aab" -Destination $aab -Force
    Write-Host "AAB: $aab" -ForegroundColor Green

    # El mapping.txt de R8 queda en una carpeta con nombre aleatorio dentro de eas-tmp.
    $mapping = (& wsl.exe -d $Distro -- bash -lc "find /home/ander/eas-tmp -path '*/outputs/mapping/release/mapping.txt' 2>/dev/null | head -1").Trim()
    if ($mapping) {
        $destino = Join-Path $Salida "Tino-$Perfil-v$siguiente-mapping.txt"
        Copy-Item -Path ("\\wsl.localhost\$Distro" + ($mapping -replace '/', '\')) -Destination $destino -Force
        Write-Host "Mapping (R8): $destino" -ForegroundColor Green
    }

    Write-Host "`n==> Listo: Tino $Perfil v$siguiente" -ForegroundColor Cyan
}
catch {
    $huboError = $true
    Write-Host "`n==> ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    Write-Host ""
    Read-Host "Presiona Enter para cerrar"
}

if ($huboError) { exit 1 }
