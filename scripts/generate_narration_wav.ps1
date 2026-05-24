Add-Type -AssemblyName System.Speech

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$videoDir = Join-Path $root "docs\video"
$textPath = Join-Path $videoDir "NARRACAO_FINAL.txt"
$wavPath = Join-Path $videoDir "narracao.wav"

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Maria Desktop")
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile($wavPath)
$synth.Speak((Get-Content -Raw $textPath))
$synth.Dispose()

Write-Host "Narracao gerada em $wavPath"
