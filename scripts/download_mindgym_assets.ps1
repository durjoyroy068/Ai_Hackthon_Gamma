$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root "public\models\mind-gym"
New-Item -ItemType Directory -Force -Path $target | Out-Null

$assets = @{
  "classroom.glb"    = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF-Binary/DamagedHelmet.glb"
  "presentation.glb" = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoomBox/glTF-Binary/BoomBox.glb"
  "conflict.glb"     = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb"
  "social.glb"       = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb"
  "stress.glb"       = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Lantern/glTF-Binary/Lantern.glb"
  "coach.glb"        = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb"
}

foreach ($name in $assets.Keys) {
  $uri = $assets[$name]
  $out = Join-Path $target $name
  Write-Host "Downloading $name ..."
  Invoke-WebRequest -Uri $uri -OutFile $out
}

Write-Host ""
Write-Host "Downloaded assets:"
Get-ChildItem $target -Filter *.glb | Select-Object Name, Length
