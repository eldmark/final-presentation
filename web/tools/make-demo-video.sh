#!/usr/bin/env bash
# Genera la demo de las conclusiones: sin audio, a 3x, con la cuenta de Google difuminada.
# Uso: tools/make-demo-video.sh "/ruta/al/video-original.mp4"
# Los tiempos (en segundos del video original) son para la grabación del 3 de noviembre de 2026
# («2026-11-03 10-35-42.mp4»); si se cambia el video, hay que reajustarlos.
#  - Se recorta el inicio (ventana de OBS, hasta 1.2 s) y el final (OBS de nuevo, desde 107.8 s).
#  - Se difumina el nombre, el avatar y el correo del perfil (de 5.0 s a 18.2 s del original).
set -euo pipefail
IN="${1:?uso: $0 video.mp4}"
OUT="$(dirname "$0")/../public/media"
mkdir -p "$OUT"

FILTER="[0:v]trim=start=1.2:end=107.8,setpts=PTS-STARTPTS,split=2[base][r1];"
FILTER+="[r1]crop=290:75:145:155,gblur=sigma=14:steps=3[br1];"
FILTER+="[base][br1]overlay=145:155:enable='between(t,3.8,17.0)'[o1];"
FILTER+="[o1]setpts=PTS/3,fps=30,scale=1280:720[v]"

ffmpeg -v error -y -i "$IN" -an -filter_complex "$FILTER" -map "[v]" \
  -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart "$OUT/demo-rapido.mp4"
ffmpeg -v error -y -i "$OUT/demo-rapido.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 "$OUT/demo-rapido.webm"
ls -la "$OUT"
