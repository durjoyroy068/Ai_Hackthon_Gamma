$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "public\images\mind-gym"
New-Item -ItemType Directory -Force -Path $out | Out-Null

# Scenario-matched still images for Mind Gym reflective sessions (Unsplash).
$assets = @{
  "exam.jpg"            = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1400&q=80"
  "presentation.jpg"    = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1400&q=80"
  "conflict.jpg"        = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80"
  "social.jpg"          = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80"
  "academic_stress.jpg" = "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1400&q=80"
  "interview.jpg"       = "https://images.unsplash.com/photo-1565688534245-05d6b5be184a?auto=format&fit=crop&w=1400&q=80"
  "result_day.jpg"      = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"
  "group_study.jpg"     = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"
  "lonely_campus.jpg"   = "https://images.unsplash.com/photo-1498079022511-d15614cb1c02?auto=format&fit=crop&w=1400&q=80"
  "ask_teacher.jpg"     = "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1400&q=80"
  "roommate.jpg"        = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80"
  "deadline.jpg"        = "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1400&q=80"
}

foreach ($name in $assets.Keys) {
  $uri = $assets[$name]
  $dest = Join-Path $out $name
  Write-Host "Downloading $name ..."
  Invoke-WebRequest -Uri $uri -OutFile $dest -UserAgent "Mozilla/5.0 MindGymAssetFetcher"
}

Write-Host ""
Write-Host "Downloaded images:"
Get-ChildItem $out -Filter *.jpg | Select-Object Name, Length
