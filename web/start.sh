#!/usr/bin/env bash
# Levanta la presentación en Docker y muestra las direcciones a usar.
set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || touch .env
get() { grep -E "^$1=" .env | head -1 | cut -d= -f2- || true; }
set_var() { if grep -qE "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else echo "$1=$2" >> .env; fi; }

PORT_V="$(get PORT)"; PORT_V="${PORT_V:-8088}"
TOKEN="$(get PRESENTER_TOKEN)"
[ -n "$TOKEN" ] || TOKEN="$(head -c 6 /dev/urandom | od -An -tx1 | tr -d ' \n')"
lan_ip() {
  { ip -4 route get 1.1.1.1 2>/dev/null | sed -n 's/.* src \([0-9.]*\).*/\1/p'; } || true
}
LAN_IP="$(lan_ip)"
if [ -z "$LAN_IP" ]; then LAN_IP="$( { hostname -I 2>/dev/null | awk '{print $1}'; } || true )"; fi
PUBLIC="$(get PUBLIC_URL)"; PUBLIC="${PUBLIC:-http://${LAN_IP:-localhost}:${PORT_V}}"
set_var PORT "$PORT_V"; set_var PRESENTER_TOKEN "$TOKEN"; set_var PUBLIC_URL "$PUBLIC"

docker compose up -d --build

echo
echo "Presentación lista."
echo "  En este equipo:  http://localhost:${PORT_V}/?k=${TOKEN}"
echo "  Desde el celular: ${PUBLIC}/remote?k=${TOKEN}"
echo "  QR para todos:   http://localhost:${PORT_V}/mobile-qr?k=${TOKEN}   (se puede proyectar)"
echo "  (el celular debe estar en la misma red Wi-Fi; el QR aparece en la vista del presentador, tecla P)"
