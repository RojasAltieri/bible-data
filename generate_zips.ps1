# Script para generar ZIPs de cada versión de la Biblia
# Ejecutar esto cada vez que se actualicen o agreguen biblias

$biblesDir = Join-Path $PSScriptRoot "bibles"
$versions = Get-ChildItem -Path $biblesDir -Directory

Write-Host "Generando ZIPs para versiones en: $biblesDir"

foreach ($version in $versions) {
    $versionName = $version.Name
    $sourcePath = $version.FullName
    $zipPath = Join-Path $biblesDir "$versionName.zip"

    Write-Host "Procesando $versionName..."
    
    # Eliminar ZIP anterior si existe
    if (Test-Path $zipPath) {
        Remove-Item $zipPath
    }

    # Crear nuevo ZIP
    # Comprimimos el CONTENIDO de la carpeta, no la carpeta en sí misma, para facilitar la extracción
    Compress-Archive -Path "$sourcePath\*" -DestinationPath $zipPath -CompressionLevel Optimal

    Write-Host "✅ ZIP creado: $versionName.zip"
}

Write-Host "🎉 Proceso completado. Recuerda hacer Push de los cambios."
