# Reclamación de impagos: landing y calculadora

Calculadora de intereses de demora (Ley 3/2004) con lista de espera. Vite + TypeScript, sin framework.

## Desarrollo
    npm install
    npm run dev

El formulario de la lista de espera solo funciona una vez desplegado en Netlify.

## Despliegue
1. Sube el proyecto a un repositorio de GitHub.
2. En Netlify: Add new site, Import from Git. Ya hay un `netlify.toml` con el build.
3. Tras el primer deploy, en Forms > waitlist activa las notificaciones por correo. Los envíos también quedan en el panel.
4. Conecta tu dominio en Domain management.

## Mantenimiento
- Cada enero y julio, añade el nuevo tipo en `src/calc.ts` (constante `RATES`) con la resolución del BOE.
- Verifica el tipo del primer semestre de 2026 (10,15 %) contra el BOE antes de lanzar.

## Para validar el nicho
- Mide visitas, usos de la calculadora y correos apuntados durante dos semanas.
- Añade analítica sin cookies (Plausible o Umami) y evento al pulsar Calcular.
- Empieza a atraer búsquedas: «cómo reclamar una factura impagada», «interés de demora 2026».
