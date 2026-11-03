# Matrices de lubricación · Zijin-Continental Gold

Página web (GitHub Pages) con la **matriz de cambio de aceite de cada equipo** (una por equipo del IH08: T001, DL001, B003…). En el inicio se agrupan por modelo y al desplegar el modelo se elige el equipo. Los técnicos escanean el QR pegado en el equipo y llegan directo a su matriz. Desde ahí pueden volver al inicio y buscar cualquier otro equipo.

- Cada equipo arrancó con la matriz de su modelo tomada del archivo `MATRIZ_LUBRICACION_CNL_FINAL` (80 matrices por modelo, que quedan como plantillas), cada una con su diagrama de puntos tal como está en Excel y los enlaces a las fichas técnicas de los lubricantes (los QR de «Ver información de lubricante»). Las hojas de ENGRASE no se incluyeron.
- **Editar matriz** y **Nueva matriz** piden la contraseña de edición (`MATRIZEQUIPOS26`).
- Antes de guardar, el editor debe escribir su **nombre**, su **documento de identificación** y la **justificación** del cambio. La página agrega sola la **fecha**, la **matriz** y la lista de **cambios realizados**.
- El historial se guarda **cifrado** en el repositorio. Solo se puede ver dentro de la página (botón *Historial*, con la contraseña) y se puede descargar en CSV para Excel.
- **Cada equipo tiene su propia matriz y su propio QR** (por ejemplo `?u=T001`). Al editar T001 solo cambia T001, así que varios equipos del mismo modelo pueden tener lubricantes, cantidades o intervalos distintos. Si quiere repetir un cambio en varios equipos, use «Aplicar también a otros equipos» en el editor.
- El inicio tiene buscador general y filtros por **flota, modelo y equipo** (tomados del IH08), con selección múltiple, buscador y borrador de filtros.
- Cada matriz tiene un botón **Descargar** con dos opciones: la etiqueta del **código QR** (PNG de 1500 px, lista para imprimir) o la **matriz completa** (PNG de 2400 px).
- Editar una matriz **no cambia su QR**: el QR apunta a un identificador fijo (`?eq=cat-montacarga`), no al nombre del equipo.
- Si un celular ya abrió la página una vez, puede volver a abrirla aunque se quede sin señal.

---

## Instalación (una sola vez, unos 15 minutos)

### 1. Crear el repositorio
1. Entre a <https://github.com> con su cuenta (o cree una).
2. Haga clic en **+ → New repository**.
3. En *Repository name* escriba, por ejemplo, `matrices-lubricacion`.
4. Seleccione **Public**. El plan gratuito de GitHub Pages lo exige; vea la nota de privacidad al final.
5. Haga clic en **Create repository**.

### 2. Subir los archivos (en 3 partes)
GitHub acepta máximo 100 archivos por subida, por eso la página viene en tres ZIP: `parte1`, `parte2` y `parte3`.
1. Descomprima los tres ZIP en su computador.
2. **Parte 1:** en el repositorio vacío haga clic en **uploading an existing file**. Abra la carpeta `matrices-lubricacion-parte1`, seleccione **todo su contenido** (Ctrl+A) y arrástrelo a GitHub. Haga clic en **Commit changes**.
3. **Parte 2:** en el repositorio, **Add file → Upload files**. Abra `matrices-lubricacion-parte2` y arrastre la carpeta `img` que hay dentro. Haga clic en **Commit changes**.
4. **Parte 3:** igual que la parte 2, con la carpeta `img` de `matrices-lubricacion-parte3`.

GitHub une las carpetas `img` de las tres partes. Al final, en la página principal del repositorio deben verse `index.html` y las carpetas `css`, `data`, `fonts`, `img` y `js`.

> El archivo `.nojekyll` es oculto en algunos computadores. Si no se sube, no pasa nada.

### 3. Publicar con GitHub Pages
1. En el repositorio, entre a **Settings → Pages**.
2. En *Source* elija **Deploy from a branch**, luego la rama **main** y la carpeta **/ (root)**, y haga clic en **Save**.
3. Espere 1 o 2 minutos. La dirección queda así:
   `https://SU-USUARIO.github.io/matrices-lubricacion/`

En este punto los técnicos ya pueden consultar las matrices. Los pasos 4 y 5 activan el guardado de las ediciones.

### 4. Crear el token de GitHub (permiso para guardar)
1. Haga clic en su foto (arriba a la derecha) y entre a **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Llene estos campos:
   - **Token name**: `matrices-lubricacion`
   - **Expiration**: hasta 1 año. Anote la fecha: cuando venza hay que repetir los pasos 4 y 5.
   - **Repository access**: *Only select repositories*, y elija `matrices-lubricacion`.
   - **Permissions → Repository permissions → Contents**: **Read and write**.
3. Haga clic en **Generate token** y copie el token (empieza por `github_pat_…`).

### 5. Activar el guardado en línea
1. Abra `https://SU-USUARIO.github.io/matrices-lubricacion/configurar.html`.
2. Revise que el usuario y el nombre del repositorio estén bien (se llenan solos).
3. Pegue el token y escriba la contraseña de edición: `MATRIZEQUIPOS26`.
4. Haga clic en **Probar y guardar**.

El token queda guardado **cifrado con la contraseña**: aunque alguien vea los archivos del repositorio, no puede usar el token sin la contraseña.

### 6. Completar y etiquetar los equipos
1. En el inicio, use **Editar matriz** para completar los datos que en el Excel estaban vacíos, como el intervalo de cambio o la cantidad (aparecen como *Por definir*).
2. Abra cada matriz y haga clic en **Descargar → QR de todos los equipos**. Se descarga un ZIP con una etiqueta por equipo: imprímalas y pegue cada una en su equipo.
3. Descargue el QR de la página de inicio (está al final del inicio) para carteleras o el taller.

---

## Uso diario

| Quién | Qué hace |
|---|---|
| Técnico | Escanea el QR del equipo y ve la matriz. Con **Inicio** busca cualquier otro equipo por nombre, código, componente o lubricante. |
| Editor | **Editar matriz** → contraseña → elige el equipo → cambia datos o imágenes → **Guardar** → escribe nombre y documento → confirma. |
| Editor | **Nueva matriz** → puede copiar los puntos de un equipo similar → guarda. El QR del equipo nuevo queda disponible enseguida. |
| Editor | **Editar matriz** → elige el equipo → al final, **Eliminar matriz** → escribe el código del equipo, nombre, documento y justificación. Si era el último equipo de su modelo, el modelo desaparece del inicio. |
| Supervisor | **Historial** → contraseña → ve quién cambió qué y cuándo. **CSV** lo descarga para Excel. |

Los cambios guardados tardan **1 a 2 minutos** en verse en los celulares de los técnicos, el tiempo que GitHub tarda en publicar.

---

## Preguntas frecuentes

**¿Cómo cambio la contraseña?**
En `configurar.html` escriba el token y la **nueva** contraseña. La página le pedirá también la contraseña actual. El historial se vuelve a cifrar con la nueva contraseña.

**El token venció o aparece «El token no es válido».**
Repita los pasos 4 y 5.

**¿Puedo cambiar el nombre del repositorio o del usuario de GitHub?**
Mejor no: la dirección de la página cambiaría y los QR ya impresos dejarían de funcionar. Si en el futuro usan un dominio propio, escríbalo en *Dirección pública* en `configurar.html` antes de imprimir los QR.

**¿Cómo cambio el logo o los colores?**
- Logo: reemplace `img/logo-blanco.png` (logo blanco con fondo transparente; mejor si mide unos 1000 px de ancho).
- Colores: están al inicio de `css/app.css` (`--marca` es el naranja corporativo `#F47A1F`).

**¿Dónde están los datos?**
`data/matrices.json` (matrices), `data/historial.json` (historial cifrado), `data/config.json` (configuración) e `img/` (imágenes subidas).

**Privacidad.** El repositorio es público, así que cualquiera con la dirección puede consultar las matrices. El historial, que tiene nombres y documentos, sí está cifrado y no se puede leer sin la contraseña. Si la empresa tiene GitHub Enterprise, el repositorio puede ser privado.
