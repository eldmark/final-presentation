#!/usr/bin/env bash
# Genera la demo de las conclusiones: sin audio, a 3x, con la cuenta de Google difuminada.
# Uso: tools/make-demo-video.sh "/ruta/al/video-original.mp4"
# Las cajas y los tiempos (en segundos del video original) son para ESTA grabación; si se cambia el video, hay que reajustarlos.
set -euo pipefail
IN="${1:?uso: $0 video.mp4}"
OUT="$(dirname "$0")/../public/media"
mkdir -p "$OUT"

blur() { # nombre ancho alto x y desde hasta
  echo "[$1]crop=$2:$3:$4:$5,gblur=sigma=14:steps=3[b$1];"
}
FILTER="[0:v]split=5[base][r1][r2][r3][r4];"
FILTER+="$(blur r1 400 70 880 405)"      # selector de cuenta de Google (nombre y correo)
FILTER+="$(blur r2 290 45 290 360)"      # chip con el correo (pantalla «Accede a…»)
FILTER+="$(blur r3 400 130 880 365)"     # nombre y correo en «Google permitirá…»
FILTER+="$(blur r4 370 90 200 205)"      # avatar, nombre y correo del perfil
FILTER+="[base][br1]overlay=880:405:enable='between(t,4.8,10.9)'[o1];"
FILTER+="[o1][br2]overlay=290:360:enable='between(t,10.9,15.4)'[o2];"
FILTER+="[o2][br3]overlay=880:365:enable='between(t,10.9,15.4)'[o3];"
FILTER+="[o3][br4]overlay=200:205:enable='between(t,25.8,39.2)+between(t,43.2,47.2)'[o4];"
FILTER+="[o4]setpts=PTS/3,fps=30,scale=1280:720[v]"

ffmpeg -v error -y -i "$IN" -an -filter_complex "$FILTER" -map "[v]" \
  -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart "$OUT/demo-rapido.mp4"
ffmpeg -v error -y -i "$OUT/demo-rapido.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 "$OUT/demo-rapido.webm"
ls -la "$OUT"
