// Matrices de lubricación — aplicación principal
import { $, $$, esc, clave, vacio, esNA, clonar, sinAcentos, fechaCorta, fechaHora, ahoraISO, hoyISO, procesarImagen, descargarBlob, nombreArchivo, debounce } from './util.js';
import { qrSVG } from './qr.js';
import { etiquetaQR, imagenMatriz } from './exportar.js';
import { abrirSesion, cifrar, descifrar } from './cripto.js';
import { Repo, datosRepo } from './github.js';

const LOGO_BLANCO = 'img/logo-blanco.png';

/* ------------------------------------------------------------------ Íconos */
const P = {
  buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  izq: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  der: '<path d="m9 18 6-6-6-6"/>',
  descargar: '<path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14"/>',
  lapiz: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m14 6 4 4"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  historial: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  imagen: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  alerta: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  fuego: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .5 2 1.5 3 2.5 3 0-3-1-5.5 0-8z"/>',
  ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  mano: '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8a8 8 0 0 0 16 0v-3a2 2 0 0 0-4 0"/>',
  vaso: '<path d="M5 8h14l-1.5 11a2 2 0 0 1-2 1.7h-7a2 2 0 0 1-2-1.7L5 8z"/><path d="M9 4h6"/>',
  aire: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7"/>',
  salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  arriba: '<path d="m18 15-6-6-6 6"/>',
  abajo: '<path d="m6 9 6 6 6-6"/>',
  basura: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  equipo: '<path d="M2 17h2.5l1.5-6h7l2.5 6H22"/><circle cx="7" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/><path d="M13 11V5h3.5L20 11"/>',
  ampliar: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  verClave: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
};
const I = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

/* ------------------------------------------------------------------ Estado */
const estado = {
  config: null,
  datos: null,
  sesion: null,         // { claveHistorial, token } — solo en memoria
  imagenesLocales: {},  // ruta → URL temporal de imágenes recién guardadas (hasta que GitHub Pages publique)
  editor: null,
};
const app = $('#app');
const capa = $('#capa');

const urlBase = () => {
  const p = estado.config && estado.config.urlPublica;
  if (p) return p.replace(/\/?$/, '/');
  return location.origin + location.pathname.replace(/index\.html$/, '');
};
const urlEquipo = (id) => `${urlBase()}?eq=${encodeURIComponent(id)}`;
const urlUnidad = (codigo) => `${urlBase()}?u=${encodeURIComponent(codigo)}`;
const src = (ruta) => estado.imagenesLocales[ruta] || ruta;
const plantilla = () => (estado.datos && estado.datos.plantilla) || {};
const lugarGeneral = () => plantilla().lugar || 'Proyecto Buriticá';

function lubricantesDe(eq, catalogo = estado.datos.lubricantes || {}) {
  const m = new Map();
  const fichas = new Map((eq.fichas || []).filter((f) => f.url).map((f) => [clave(f.nombre), f.url]));
  (eq.puntos || []).forEach((p, i) => {
    const n = String(p.lubricante || '').trim();
    if (!n || esNA(n)) return;
    const k = clave(n);
    if (!m.has(k)) m.set(k, { clave: k, nombre: n, imagen: (catalogo[k] && catalogo[k].imagen) || '', ficha: fichas.get(k) || '', puntos: [] });
    m.get(k).puntos.push(i + 1);
  });
  return [...m.values()];
}
/** Fichas técnicas cuyo nombre no coincide con ningún lubricante de los puntos. */
function fichasSueltas(eq) {
  const usados = new Set(lubricantesDe(eq).filter((l) => l.ficha).map((l) => l.clave));
  return (eq.fichas || []).filter((f) => f.url && !usados.has(clave(f.nombre)));
}
const lisSrc = (code) => { const c = String(code || '').trim(); return (estado.datos.lis || {})[c] || ''; };
const lisImg = (code) => (lisSrc(code) ? `<img class="lis" src="${esc(src(lisSrc(code)))}" alt="Color LIS ${esc(code)}">` : '');
const urlSegura = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');

function dato(v, unidad = '') {
  if (vacio(v)) return '<span class="pendiente">Por definir</span>';
  if (esNA(v)) return 'N/A';
  const s = String(v).trim();
  return esc(unidad && /^\d+([.,]\d+)?$/.test(s) ? `${s} ${unidad}` : s);
}

/* ------------------------------------------------------------- Navegación */
function leerRuta() {
  const p = new URLSearchParams(location.search);
  if (p.get('u')) return { vista: 'unidad', codigo: p.get('u') };
  if (p.get('eq')) return { vista: 'matriz', id: p.get('eq') };
  const panel = p.get('panel');
  if (panel === 'editar') return { vista: 'editar', id: p.get('id') || '' };
  if (panel === 'nueva' || panel === 'historial') return { vista: panel };
  return { vista: 'inicio' };
}
function rutaURL(r) {
  const base = location.pathname;
  if (r.vista === 'unidad') return `${base}?u=${encodeURIComponent(r.codigo)}`;
  if (r.vista === 'matriz') return `${base}?eq=${encodeURIComponent(r.id)}`;
  if (r.vista === 'editar') return `${base}?panel=editar${r.id ? `&id=${encodeURIComponent(r.id)}` : ''}`;
  if (r.vista === 'nueva' || r.vista === 'historial') return `${base}?panel=${r.vista}`;
  return base;
}
let rutaActual = { vista: 'inicio' };
async function ir(r, { reemplazar = false } = {}) {
  if (!(await puedeSalirDelEditor(r))) return;
  history[reemplazar ? 'replaceState' : 'pushState'](r, '', rutaURL(r));
  render(r);
}
window.addEventListener('popstate', async () => {
  const r = leerRuta();
  if (!(await puedeSalirDelEditor(r))) { history.pushState(rutaActual, '', rutaURL(rutaActual)); return; }
  render(r);
});

async function puedeSalirDelEditor(destino) {
  const ed = estado.editor;
  if (!ed || rutaActual.vista === destino.vista && (destino.id || '__nueva') === ed.idRuta) return true;
  if (!['editar', 'nueva'].includes(rutaActual.vista) || !ed.borrador) return true;
  if (!calcularCambios(ed).length) { estado.editor = null; return true; }
  const ok = await confirmar({ titulo: '¿Descartar los cambios?', texto: 'Tiene cambios sin guardar en esta matriz. Si sale ahora se perderán.', si: 'Descartar cambios', no: 'Seguir editando' });
  if (ok) estado.editor = null;
  return ok;
}

async function render(r) {
  rutaActual = r;
  const acc = $('#acciones-admin');
  if (acc) acc.hidden = r.vista !== 'inicio';
  cerrarCapa(false);
  window.scrollTo(0, 0);
  if (['editar', 'nueva', 'historial'].includes(r.vista)) {
    if (!estado.sesion) {
      vistaInicio();
      const ok = await pedirClave();
      if (!ok) { history.replaceState({ vista: 'inicio' }, '', rutaURL({ vista: 'inicio' })); rutaActual = { vista: 'inicio' }; return; }
    }
    if (r.vista === 'historial') return vistaHistorial();
    if (r.vista === 'nueva') return vistaEditor(null);
    if (r.id) return vistaEditor(r.id);
    return vistaSelector();
  }
  if (r.vista === 'unidad') return vistaUnidad(r);
  if (r.vista === 'matriz') return vistaMatrizOPlantilla(r.id);
  return vistaInicio();
}

/* ---------------------------------------------------------------- Capas */
let alCerrarCapa = null;
function abrirCapa(html, { alCerrar = null, clase = '' } = {}) {
  capa.innerHTML = `<div class="fondo-capa ${clase}" data-fondo>${html}</div>`;
  capa.classList.add('abierta');
  document.body.classList.add('sin-scroll');
  alCerrarCapa = alCerrar;
  const foco = capa.querySelector('[autofocus], input, select, textarea, button');
  if (foco) setTimeout(() => foco.focus(), 30);
}
function cerrarCapa(ejecutar = true) {
  if (!capa.classList.contains('abierta')) return;
  capa.classList.remove('abierta');
  capa.innerHTML = '';
  document.body.classList.remove('sin-scroll');
  const cb = alCerrarCapa;
  alCerrarCapa = null;
  if (ejecutar && cb) cb();
}
capa.addEventListener('click', (e) => {
  if (e.target.matches('[data-fondo]') && !capa.querySelector('[data-ocupado]')) cerrarCapa();
  if (e.target.closest('[data-cerrar]')) cerrarCapa();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && capa.classList.contains('abierta') && !capa.querySelector('[data-ocupado]')) cerrarCapa();
});

let tToast;
function toast(msg, tipo = '') {
  const t = $('#toast');
  t.innerHTML = `<div class="${tipo}">${esc(msg)}</div>`;
  t.classList.add('ver');
  clearTimeout(tToast);
  tToast = setTimeout(() => t.classList.remove('ver'), tipo === 'error' ? 5200 : 2800);
}

function confirmar({ titulo, texto, si = 'Aceptar', no = 'Cancelar' }) {
  return new Promise((resolve) => {
    abrirCapa(`<div class="dialogo" role="alertdialog" aria-modal="true" aria-labelledby="c-t">
      <div class="d-icono">${I('alerta')}</div>
      <h2 id="c-t">${esc(titulo)}</h2><p>${esc(texto)}</p>
      <div class="d-acciones"><button type="button" class="btn btn-fantasma" id="c-no">${esc(no)}</button><button type="button" class="btn btn-primario" id="c-si">${esc(si)}</button></div>
    </div>`, { alCerrar: () => resolve(false) });
    $('#c-no').onclick = () => cerrarCapa();
    $('#c-si').onclick = () => { cerrarCapa(false); resolve(true); };
  });
}

function pie(texto) {
  return `<footer class="pie"><div class="contenedor"><span><b>${esc(texto || plantilla().departamento || 'Departamento de Tribología')}</b> · ${esc(lugarGeneral())} · Juan José Manco Rueda</span><span>Zijin · Continental Gold</span></div></footer>`;
}

/* ------------------------------------------------------------------ Inicio */
const FILTROS = [['flota', 'Flota'], ['modelo', 'Modelo'], ['equipo', 'Equipo']];
estado.filtros = { flota: new Set(), modelo: new Set(), equipo: new Set() };
estado.q = '';
estado.abiertos = new Set();

function mapaIH08() {
  if (estado._ihDe !== estado.datos) {
    estado._ihDe = estado.datos;
    estado._ih = new Map((estado.datos.ih08 || []).map((u) => [u.equipo, u]));
  }
  return estado._ih;
}
const unicos = (xs) => [...new Set(xs.filter(Boolean))];
const buscarEquipo = (id) => estado.datos.equipos.find((e) => e.id === id) || estado.datos.equipos.find((e) => e.id.toUpperCase() === String(id || '').toUpperCase());
const delModelo = (modelo) => estado.datos.equipos.filter((e) => e.modelo === modelo).sort((x, y) => x.equipo.localeCompare(y.equipo, 'es', { numeric: true }));
const firma = (e) => JSON.stringify([e.puntos, e.fichas || [], e.imagen || '']);

function textoBusqueda(eq) {
  return sinAcentos([eq.equipo, eq.descripcion, eq.modelo, eq.flota, eq.activo,
    ...(eq.puntos || []).flatMap((p) => [p.componente, p.lubricante, p.codigoLIS])].join(' ')).toLowerCase();
}
function resaltar(texto, terminos) {
  let h = esc(texto);
  if (!terminos.length) return h;
  const plano = sinAcentos(texto).toLowerCase();
  const marcas = [];
  terminos.forEach((t) => {
    let i = plano.indexOf(t);
    while (i >= 0) { marcas.push([i, i + t.length]); i = plano.indexOf(t, i + t.length); }
  });
  if (!marcas.length) return h;
  marcas.sort((a, b) => a[0] - b[0]);
  let out = '', pos = 0;
  for (const [a, b] of marcas) {
    if (a < pos) continue;
    out += esc(texto.slice(pos, a)) + `<mark class="marca">${esc(texto.slice(a, b))}</mark>`;
    pos = b;
  }
  return out + esc(texto.slice(pos));
}

const hayFiltros = () => FILTROS.some(([f]) => estado.filtros[f].size);
function pasaFiltros(e, excepto = '') {
  return FILTROS.every(([f]) => f === excepto || !estado.filtros[f].size || estado.filtros[f].has(e[f]));
}

function listaFiltrada(q, usarFiltros = true) {
  const terminos = sinAcentos(q).toLowerCase().split(/\s+/).filter(Boolean);
  const lista = estado.datos.equipos.filter((e) => {
    const t = textoBusqueda(e);
    if (!terminos.every((x) => t.includes(x))) return false;
    return !usarFiltros || pasaFiltros(e);
  });
  return { terminos, lista };
}

/** Agrupa las matrices de equipo por modelo (IH08). */
function agrupar(lista) {
  const m = new Map();
  lista.forEach((e) => { const k = e.modelo || 'Sin modelo'; if (!m.has(k)) m.set(k, []); m.get(k).push(e); });
  return [...m.entries()].map(([modelo, eqs]) => ({ modelo, eqs: eqs.sort((x, y) => x.equipo.localeCompare(y.equipo, 'es', { numeric: true })) }))
    .sort((x, y) => x.modelo.localeCompare(y.modelo, 'es', { numeric: true }));
}

function tarjetaGrupo(g, terminos, accion, abierto) {
  const todos = delModelo(g.modelo);
  const cuenta = new Map();
  todos.forEach((e) => { const f = firma(e); cuenta.set(f, (cuenta.get(f) || 0) + 1); });
  const comun = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const conFoto = todos.find((e) => e.foto) || todos.find((e) => e.imagen);
  const foto = conFoto ? (conFoto.foto || conFoto.imagen) : '';
  const flotas = unicos(todos.map((e) => e.flota)).join(' · ');
  const nombres = unicos(todos.map((e) => e.activo));
  const idp = `g-${clave(g.modelo)}`;
  const parcial = g.eqs.length < todos.length;
  return `<li class="grupo ${abierto ? 'abierto' : ''}" data-modelo="${esc(g.modelo)}">
    <button type="button" class="grupo-cab" aria-expanded="${abierto}" aria-controls="${idp}">
      <span class="miniatura foto">${foto ? `<img src="${esc(src(foto))}" alt="" loading="lazy">` : I('equipo')}</span>
      <span class="te-cuerpo">
        <span class="te-nombre">${resaltar(g.modelo, terminos)}</span>
        <span class="te-meta">${flotas ? `${resaltar(flotas, terminos)} · ` : ''}${parcial ? `${g.eqs.length} de ${todos.length}` : todos.length} equipo${todos.length === 1 ? '' : 's'}</span>
        <span class="te-comp">${resaltar(nombres.join(' · '), terminos)}</span>
      </span>
      <span class="grupo-flecha">${I('abajo')}</span>
    </button>
    <div class="grupo-cuerpo" id="${idp}" ${abierto ? '' : 'hidden'}>
      <ul class="grupo-unidades">${g.eqs.map((e) => {
        const href = accion === 'ver' ? `?u=${encodeURIComponent(e.id)}` : `?panel=editar&id=${encodeURIComponent(e.id)}`;
        const data = accion === 'ver' ? `data-unidad-ir="${esc(e.id)}"` : `data-editar="${esc(e.id)}"`;
        return `<li><a href="${href}" ${data}>
          <b>${resaltar(e.equipo, terminos)}</b>
          <span>${resaltar(e.descripcion || e.activo || '', terminos)}</span>
          ${comun && firma(e) !== comun && todos.length > 1 ? '<em class="propia">Matriz propia</em>' : ''}
          ${I('der', 'i-peq')}</a></li>`;
      }).join('')}</ul>
      ${accion === 'ver' && g.eqs.length > 1 ? `<button type="button" class="btn btn-fantasma btn-peq" data-accion="qr-modelo" data-modelo="${esc(g.modelo)}">${I('qr', 'i-peq')} Descargar QR de ${g.eqs.length} equipos (ZIP)</button>` : ''}
    </div>
  </li>`;
}

/** Opciones de un filtro según los demás filtros activos (filtros encadenados). */
function opcionesFiltro(f) {
  const cuenta = new Map();
  estado.datos.equipos.forEach((e) => {
    if (!pasaFiltros(e, f)) return;
    const v = e[f];
    if (!v) return;
    cuenta.set(v, (cuenta.get(v) || 0) + 1);
  });
  estado.filtros[f].forEach((v) => { if (!cuenta.has(v)) cuenta.set(v, 0); });
  const m = new Map(estado.datos.equipos.map((e) => [e.equipo, e.modelo]));
  return [...cuenta.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es', { numeric: true }))
    .map(([v, n]) => ({ v, n, extra: f === 'equipo' ? m.get(v) || '' : '' }));
}

function htmlFiltros() {
  return `<div class="filtros" id="filtros">
    ${FILTROS.map(([f, etq]) => `<div class="filtro" data-filtro="${f}">
      <button type="button" class="filtro-btn" aria-expanded="false" aria-controls="fp-${f}">
        <span>${etq}</span><span class="filtro-n" hidden></span>${I('abajo', 'i-peq')}</button>
      <div class="filtro-panel" id="fp-${f}" role="dialog" aria-label="Filtrar por ${etq.toLowerCase()}" hidden>
        <div class="filtro-cab"><b>${etq}</b><button type="button" class="btn btn-icono btn-fantasma btn-peq" data-cerrar-filtro aria-label="Cerrar">${I('x')}</button></div>
        <div class="filtro-buscar">${I('buscar', 'i-peq')}<input type="search" placeholder="Buscar ${etq.toLowerCase()}" aria-label="Buscar ${etq.toLowerCase()}" autocomplete="off"></div>
        <ul class="filtro-opciones" role="group" aria-label="Opciones de ${etq.toLowerCase()}"></ul>
        <div class="filtro-pie"><button type="button" class="btn btn-fantasma btn-peq" data-limpiar-filtro>${I('basura', 'i-peq')} Limpiar</button><button type="button" class="btn btn-primario btn-peq" data-cerrar-filtro>Listo</button></div>
      </div>
    </div>`).join('')}
    <button type="button" class="btn btn-fantasma btn-peq borrar-todo" id="borrar-filtros">${I('x', 'i-peq')} Borrar todos los filtros</button>
  </div>
  <div class="chips-filtros" id="chips-filtros"></div>`;
}

function montarBuscador(accion) {
  const input = $('#q'), limpiar = $('#q-limpiar'), caja = $('#filtros');
  if (caja) input.value = estado.q;
  const pintarOpciones = (fd) => {
    const f = fd.dataset.filtro, q = sinAcentos($('.filtro-buscar input', fd).value).toLowerCase();
    const ops = opcionesFiltro(f).filter((o) => !q || sinAcentos(`${o.v} ${o.extra}`).toLowerCase().includes(q));
    $('.filtro-opciones', fd).innerHTML = ops.length ? ops.map((o) => `<li><label class="opcion-f">
        <input type="checkbox" value="${esc(o.v)}" ${estado.filtros[f].has(o.v) ? 'checked' : ''}>
        <span>${esc(o.v)}${o.extra ? ` <small>${esc(o.extra)}</small>` : ''}</span><span class="cnt">${o.n}</span></label></li>`).join('')
      : '<li class="filtro-vacio">Sin coincidencias</li>';
  };
  const pintar = () => {
    if (!document.body.contains(input)) return; // la vista ya cambió
    if (caja) estado.q = input.value;
    const { terminos, lista } = listaFiltrada(input.value, !!caja);
    limpiar.hidden = !input.value;
    const grupos = agrupar(lista);
    const total = estado.datos.equipos.length;
    const activo = terminos.length || (caja && hayFiltros());
    $('#conteo').textContent = activo
      ? `${lista.length} de ${total} equipos · ${grupos.length} modelo${grupos.length === 1 ? '' : 's'}`
      : `${total} equipos en ${grupos.length} modelos`;
    const abrirTodo = activo && grupos.length <= 4;
    $('#lista').innerHTML = grupos.length
      ? grupos.map((g) => tarjetaGrupo(g, terminos, accion, abrirTodo || estado.abiertos.has(g.modelo))).join('')
      : `<li class="sin-resultados">No hay equipos con esa búsqueda o filtros.<br>Pruebe con otro término o borre los filtros.</li>`;
    if (caja) {
      FILTROS.forEach(([f]) => {
        const n = estado.filtros[f].size, b = $(`[data-filtro="${f}"] .filtro-n`, caja);
        b.hidden = !n; b.textContent = n;
        $(`[data-filtro="${f}"] .filtro-btn`, caja).classList.toggle('activo', !!n);
      });
      $('#borrar-filtros').disabled = !activo;
      $('#chips-filtros').innerHTML = FILTROS.flatMap(([f, etq]) => [...estado.filtros[f]].map((v) =>
        `<button type="button" class="chip-f" data-quitar="${f}" data-v="${esc(v)}" aria-label="Quitar ${etq} ${esc(v)}"><small>${etq}</small> ${esc(v)} ${I('x', 'i-peq')}</button>`)).join('');
      $$('.filtro-panel:not([hidden])', caja).forEach((p) => pintarOpciones(p.closest('.filtro')));
    }
  };
  input.addEventListener('input', debounce(pintar, 80));
  limpiar.addEventListener('click', () => { input.value = ''; pintar(); input.focus(); });
  $('#lista').addEventListener('click', (e) => {
    const cab = e.target.closest('.grupo-cab');
    if (!cab) return;
    const li = cab.closest('.grupo'), m = li.dataset.modelo;
    const abrir = cab.getAttribute('aria-expanded') !== 'true';
    cab.setAttribute('aria-expanded', String(abrir));
    li.classList.toggle('abierto', abrir);
    $('.grupo-cuerpo', li).hidden = !abrir;
    if (abrir) estado.abiertos.add(m); else estado.abiertos.delete(m);
  });
  if (caja) {
    const cerrar = (fd) => { $('.filtro-panel', fd).hidden = true; $('.filtro-btn', fd).setAttribute('aria-expanded', 'false'); document.body.classList.remove('filtro-abierto'); };
    const cerrarTodos = () => $$('.filtro', caja).forEach(cerrar);
    caja.addEventListener('click', (e) => {
      const fd = e.target.closest('.filtro');
      if (e.target.closest('#borrar-filtros')) {
        FILTROS.forEach(([f]) => estado.filtros[f].clear()); input.value = ''; cerrarTodos(); pintar(); return;
      }
      if (!fd) return;
      if (e.target.closest('.filtro-btn')) {
        const abierto = !$('.filtro-panel', fd).hidden;
        cerrarTodos();
        if (!abierto) {
          $('.filtro-panel', fd).hidden = false; $('.filtro-btn', fd).setAttribute('aria-expanded', 'true');
          document.body.classList.add('filtro-abierto');
          $('.filtro-buscar input', fd).value = '';
          pintarOpciones(fd);
          if (window.matchMedia('(min-width: 720px)').matches) $('.filtro-buscar input', fd).focus();
        }
        return;
      }
      if (e.target.closest('[data-cerrar-filtro]')) { cerrar(fd); $('.filtro-btn', fd).focus(); return; }
      if (e.target.closest('[data-limpiar-filtro]')) { estado.filtros[fd.dataset.filtro].clear(); pintar(); }
    });
    caja.addEventListener('change', (e) => {
      if (e.target.type !== 'checkbox') return;
      const f = e.target.closest('.filtro').dataset.filtro;
      if (e.target.checked) estado.filtros[f].add(e.target.value); else estado.filtros[f].delete(e.target.value);
      pintar();
    });
    caja.addEventListener('input', (e) => { if (e.target.closest('.filtro-buscar')) pintarOpciones(e.target.closest('.filtro')); });
    caja.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const fd = e.target.closest('.filtro'); if (fd) { cerrar(fd); $('.filtro-btn', fd).focus(); e.stopPropagation(); } } });
    $('#chips-filtros').addEventListener('click', (e) => {
      const c = e.target.closest('[data-quitar]');
      if (c) { estado.filtros[c.dataset.quitar].delete(c.dataset.v); pintar(); }
    });
  }
  pintar();
}

function htmlBuscador(placeholder) {
  return `<div class="buscador" role="search">
    ${I('buscar')}
    <input id="q" type="search" placeholder="${esc(placeholder)}" aria-label="Buscar" autocomplete="off" enterkeyhint="search">
    <button type="button" class="btn btn-icono btn-fantasma limpiar" id="q-limpiar" hidden aria-label="Limpiar búsqueda">${I('x')}</button>
  </div>`;
}

function vistaInicio() {
  document.title = 'Matrices de lubricación - MEM · Zijin-Continental Gold';
  app.innerHTML = `
  <section class="portada contenedor">
    <p class="eyebrow">${esc(plantilla().departamento || 'Departamento de Tribología')}</p>
    <h1>Matrices de lubricación - MEM</h1>
    <p class="lead">Cambio de aceite por equipo · ${esc(lugarGeneral())}</p>
    ${htmlBuscador('Buscar equipo, modelo, componente o lubricante')}
    ${htmlFiltros()}
  </section>
  <section class="contenedor" aria-label="Equipos por modelo">
    <p class="conteo" id="conteo" aria-live="polite"></p>
    <ul class="tarjetas grupos" id="lista"></ul>
    <div class="qr-inicio">
      <div class="qr">${qrSVG(urlBase(), { titulo: 'Código QR de la página de inicio' })}</div>
      <div>
        <h2>QR de la página de inicio</h2>
        <p>Escanéelo para abrir el buscador de matrices desde cualquier celular.</p>
        <button type="button" class="btn btn-sec btn-peq" data-accion="qr-inicio">${I('descargar')} Descargar QR</button>
      </div>
    </div>
    ${htmlOffline()}
  </section>
  ${pie()}`;
  montarBuscador('ver');
}

/* ------------------------------------------------------------------ Matriz */
/** QR de un equipo (?u=T001): abre exactamente la matriz de ese equipo. */
function vistaUnidad(r) {
  const cod = String(r.codigo || '').trim();
  const eq = buscarEquipo(cod);
  if (eq) { rutaActual.id = eq.id; return vistaMatriz(eq.id); }
  const u = mapaIH08().get(cod) || {};
  document.title = `Equipo ${cod}`;
  app.innerHTML = `<div class="estado-vacio contenedor"><div class="d-icono">${I('qr')}</div>
    <h1>${esc(cod)} no tiene matriz</h1>
    <p>${u.descripcion ? `${esc(u.descripcion)}. ` : ''}Este equipo aún no tiene matriz de cambio de aceite. Búsquelo desde el inicio o pida a un editor que la cree con «Nueva matriz».</p>
    <a class="btn btn-primario" href="./" data-nav="inicio">${I('buscar')} Ir al buscador</a></div>`;
}

/** Enlaces antiguos ?eq=: si es una matriz por modelo (plantilla) muestra sus equipos. */
function vistaMatrizOPlantilla(id) {
  if (buscarEquipo(id)) return vistaMatriz(buscarEquipo(id).id);
  const p = (estado.datos.plantillas || []).find((x) => x.id === id);
  const eqs = p ? estado.datos.equipos.filter((e) => e.plantilla === id) : [];
  if (!eqs.length) return vistaMatriz(id);
  document.title = p.activo;
  app.innerHTML = `<div class="barra"><div class="contenedor barra-in"><a class="btn btn-fantasma" href="./" data-nav="inicio">${I('izq')} Inicio</a></div></div>
    <section class="contenedor vista-admin"><p class="eyebrow">${esc(p.activo)}</p><h1>Seleccione el equipo</h1>
    <p class="lead">Cada equipo tiene su propia matriz.</p>
    <ul class="tarjetas grupos" style="margin-top:18px">${agrupar(eqs).map((g) => tarjetaGrupo(g, [], 'ver', true)).join('')}</ul></section>${pie()}`;
}

function vistaMatriz(id) {
  const eq = buscarEquipo(id);
  if (!eq) {
    document.title = 'Matriz no encontrada';
    app.innerHTML = `<div class="estado-vacio contenedor">
      <div class="d-icono">${I('qr')}</div>
      <h1>No encontramos esta matriz</h1>
      <p>El código QR o el enlace no corresponde a ninguna matriz registrada («${esc(id)}»). Busque el equipo desde el inicio.</p>
      <a class="btn btn-primario" href="./" data-nav="inicio">${I('buscar')} Ir al buscador</a>
    </div>`;
    return;
  }
  rutaActual.id = eq.id;
  document.title = `${eq.equipo} · Matriz de cambio de aceite`;
  const hermanos = delModelo(eq.modelo).filter((x) => x.id !== eq.id);
  const lubs = lubricantesDe(eq);
  const pa = eq.primerosAuxilios || {};
  const filas = eq.puntos.map((p, i) => `
    <li class="punto">
      <div class="p-cab"><span class="num" aria-label="Punto ${i + 1}">${i + 1}</span>
        <div><h3>${esc(p.componente || '—')}</h3><p class="p-lub">${vacio(p.lubricante) ? '<span class="pendiente">Lubricante por definir</span>' : esc(p.lubricante)}</p></div></div>
      <dl class="p-datos">
        <div class="destacado"><dt>Cantidad total</dt><dd>${dato(p.cantidad, 'gal')}</dd></div>
        <div class="destacado"><dt>Cambio de aceite</dt><dd>${dato(p.intervaloCambio)}</dd></div>
        <div><dt>Código LIS</dt><dd>${lisImg(p.codigoLIS)}${dato(p.codigoLIS)}</dd></div>
        <div><dt>Muestreo</dt><dd>${dato(p.intervaloMuestreo, 'h')}</dd></div>
        <div><dt>Método</dt><dd>${dato(p.metodo)}</dd></div>
        <div><dt>Tarea</dt><dd>${dato(p.tarea)}</dd></div>
        ${vacio(p.revisionNivel) ? '' : `<div class="completa"><dt>Revisión de nivel</dt><dd>${dato(p.revisionNivel)}</dd></div>`}
      </dl>
    </li>`).join('');
  const conNivel = eq.puntos.some((p) => !vacio(p.revisionNivel));
  const tabla = eq.puntos.map((p, i) => `<tr>
      <td><span class="num">${i + 1}</span></td><td class="comp">${esc(p.componente || '—')}</td><td>${lisImg(p.codigoLIS)}${dato(p.codigoLIS)}</td>
      <td>${dato(p.lubricante)}</td><td>${dato(p.cantidad, 'gal')}</td><td>${dato(p.tarea)}</td>
      <td>${dato(p.intervaloCambio)}</td><td>${dato(p.metodo)}</td><td>${dato(p.intervaloMuestreo, 'h')}</td>${conNivel ? `<td>${vacio(p.revisionNivel) ? '—' : dato(p.revisionNivel)}</td>` : ''}</tr>`).join('');
  const sueltas = fichasSueltas(eq);
  const aux = [['ojo', 'Ojos', pa.ojos], ['mano', 'Piel', pa.piel], ['vaso', 'Ingestión', pa.ingestion], ['aire', 'Inhalación', pa.inhalacion]]
    .filter(([, , t]) => !vacio(t))
    .map(([ic, k, t]) => `<div><dt>${I(ic)}<span class="visual-oculto">${k}</span></dt><dd><b>${k}</b>${esc(t)}</dd></div>`).join('');

  app.innerHTML = `
  <div class="barra"><div class="contenedor barra-in">
    <a class="btn btn-fantasma" href="./" data-nav="inicio">${I('izq')} Inicio</a>
    <span class="esp"></span>
    <button type="button" class="btn btn-primario" data-accion="descargar">${I('descargar')} Descargar</button>
  </div></div>
  <article class="contenedor matriz">
    <header class="m-cabecera">
      <div>
        <p class="eyebrow">Matriz de cambio de aceite - MEM</p>
        <h1>${esc(eq.equipo)}</h1>
        ${eq.descripcion ? `<p class="m-desc">${esc(eq.descripcion)}</p>` : ''}
        <div class="chips">
          ${eq.modelo ? `<span class="chip chip-marca">Modelo <b>${esc(eq.modelo)}</b></span>` : ''}
          ${eq.flota ? `<span class="chip">Flota <b>${esc(eq.flota)}</b></span>` : ''}
          <span class="chip">${eq.puntos.length} punto${eq.puntos.length === 1 ? '' : 's'}</span>
          <span class="chip">${esc(eq.lugar || lugarGeneral())}</span>
        </div>
        ${eq.activo ? `<p class="m-base">Matriz: ${esc(eq.activo)}</p>` : ''}
        ${hermanos.length ? `<details class="unidades"><summary>Otros equipos ${esc(eq.modelo)} (${hermanos.length})</summary>
          <ul>${hermanos.map((u) => `<li><a href="?u=${encodeURIComponent(u.id)}" data-unidad-ir="${esc(u.id)}"><b>${esc(u.equipo)}</b><small>${esc(u.flota || '')}</small></a></li>`).join('')}</ul></details>` : ''}
        <dl class="m-fechas">
          <div><dt>Elaboración</dt><dd>${esc(fechaCorta(eq.fechaElaboracion) || '—')}</dd></div>
          <div><dt>Última actualización</dt><dd>${esc(eq.actualizado ? fechaCorta(eq.actualizado) : '—')}</dd></div>
        </dl>
      </div>
      <figure class="m-imagen">${eq.imagen
        ? `<button type="button" data-accion="ampliar" data-src="${esc(src(eq.imagen))}" aria-label="Ampliar imagen de puntos de lubricación"><img src="${esc(src(eq.imagen))}" alt="Puntos de lubricación de ${esc(eq.equipo)}"><span class="ampliar">${I('ampliar', 'i-peq')} Ampliar</span></button>`
        : `<div class="m-sin-imagen">${I('imagen')}<span>Imagen de puntos de lubricación pendiente</span></div>`}</figure>
    </header>

    <section class="bloque" aria-labelledby="t-puntos">
      <h2 id="t-puntos">Puntos de cambio de aceite <span class="cuenta">${eq.puntos.length}</span></h2>
      <ol class="puntos">${filas}</ol>
      <div class="tabla-envoltura"><table class="tabla-puntos">
        <thead><tr><th>Punto</th><th>Componente</th><th>Código lubricante (LIS)</th><th>Lubricante</th><th>Cantidad total (gal)</th><th>Tarea</th><th>Intervalo de cambio de aceite</th><th>Método</th><th>Intervalo de muestreo (h)</th>${conNivel ? '<th>Revisión de nivel</th>' : ''}</tr></thead>
        <tbody>${tabla}</tbody></table></div>
    </section>

    ${lubs.length || sueltas.length ? `<section class="bloque" aria-labelledby="t-lubs">
      <h2 id="t-lubs">Información de lubricantes</h2>
      <ul class="lubs">${lubs.map((l) => `<li class="lub">
        ${l.imagen ? `<button type="button" class="miniatura" data-accion="ampliar" data-src="${esc(src(l.imagen))}" aria-label="Ampliar imagen de ${esc(l.nombre)}"><img src="${esc(src(l.imagen))}" alt=""></button>` : `<span class="miniatura vacia">${I('gota')}</span>`}
        <div><b>${esc(l.nombre)}</b><small>Punto${l.puntos.length > 1 ? 's' : ''} ${l.puntos.join(', ')}</small>
        ${urlSegura(l.ficha) ? `<a class="ficha" href="${esc(urlSegura(l.ficha))}" target="_blank" rel="noopener">${I('doc', 'i-peq')} Ficha técnica</a>` : ''}</div></li>`).join('')}
        ${sueltas.map((f) => `<li class="lub"><span class="miniatura vacia">${I('doc')}</span><div><b>${esc(f.nombre)}</b><small>Ficha técnica</small>
          ${urlSegura(f.url) ? `<a class="ficha" href="${esc(urlSegura(f.url))}" target="_blank" rel="noopener">${I('doc', 'i-peq')} Abrir ficha</a>` : ''}</div></li>`).join('')}</ul>
    </section>` : ''}

    <section class="bloque" aria-labelledby="t-seg">
      <h2 id="t-seg">Seguridad</h2>
      <div class="seguridad">
        ${eq.advertencia ? `<div class="aviso"><p class="seg-titulo">${I('alerta')} Advertencia</p><p>${esc(eq.advertencia)}</p></div>` : ''}
        ${aux || pa.nota ? `<div class="auxilios"><p class="seg-titulo">Primeros auxilios para lubricadores</p><dl class="aux-lista">${aux}</dl>${pa.nota ? `<p class="aux-nota">${esc(pa.nota)}</p>` : ''}</div>` : ''}
        ${eq.incendios ? `<div class="incendio"><p class="seg-titulo">${I('fuego')} Medida contra incendios</p><p>${esc(eq.incendios)}</p></div>` : ''}
      </div>
    </section>
  </article>
  ${pie(eq.departamento)}`;
  const foto = $('.m-imagen img');
  const ajustar = () => { if (foto.naturalWidth / foto.naturalHeight > 2) $('.m-cabecera').classList.add('ancha'); };
  if (foto) { if (foto.complete && foto.naturalWidth) ajustar(); else foto.addEventListener('load', ajustar); }
}

function etiquetaUnidad(eq) {
  return etiquetaQR({
    titulo: eq.equipo, eyebrow: 'Matriz de cambio de aceite - MEM',
    detalle: [eq.modelo, eq.flota].filter(Boolean).join(' · ') || eq.activo,
    url: urlUnidad(eq.id), pie: `${eq.departamento || 'Departamento de Tribología'} · ${eq.lugar || lugarGeneral()}`, logoBlanco: LOGO_BLANCO,
  });
}
function cargarJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  return new Promise((res, rej) => {
    const sc = document.createElement('script');
    sc.src = 'js/vendor/jszip.min.js';
    sc.onload = () => res(window.JSZip);
    sc.onerror = () => rej(new Error('No se pudo cargar el compresor ZIP'));
    document.head.appendChild(sc);
  });
}
async function zipQR(eqs, nombre, avance = () => {}) {
  const JSZip = await cargarJSZip();
  const zip = new JSZip();
  for (let i = 0; i < eqs.length; i++) {
    avance(i + 1, eqs.length);
    zip.file(`QR_${nombreArchivo(eqs[i].equipo)}.png`, await etiquetaUnidad(eqs[i]));
  }
  descargarBlob(await zip.generateAsync({ type: 'blob' }), `QR_${nombreArchivo(nombre)}.zip`);
}

function hojaDescarga(eq) {
  const todos = delModelo(eq.modelo);
  abrirCapa(`<div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="t-desc">
    <h2 id="t-desc">Descargar</h2>
    <p>Equipo ${esc(eq.equipo)} · seleccione qué desea descargar.</p>
    <button type="button" class="opcion" data-desc="qr"><span class="op-icono">${I('qr')}</span><span><b>Código QR del equipo ${esc(eq.equipo)}</b><small>Etiqueta PNG para imprimir y pegar en el equipo</small></span></button>
    <button type="button" class="opcion" data-desc="matriz"><span class="op-icono">${I('doc')}</span><span><b>Matriz de lubricación</b><small>Imagen PNG en alta resolución</small></span></button>
    ${todos.length > 1 ? `<button type="button" class="opcion" data-desc="qr-todos"><span class="op-icono">${I('qr')}</span><span><b>QR de los ${todos.length} equipos ${esc(eq.modelo)}</b><small>Archivo ZIP con una etiqueta por equipo</small></span></button>` : ''}
    <button type="button" class="btn btn-fantasma ancho" data-cerrar>Cancelar</button>
  </div>`);
  capa.querySelectorAll('[data-desc]').forEach((b) => b.addEventListener('click', async () => {
    if (capa.querySelector('[data-ocupado]')) return;
    b.setAttribute('aria-busy', 'true');
    b.setAttribute('data-ocupado', '');
    const small = b.querySelector('small'), antes = small.textContent;
    small.textContent = 'Generando…';
    const tipo = b.dataset.desc;
    try {
      if (tipo === 'qr') descargarBlob(await etiquetaUnidad(eq), `QR_${nombreArchivo(eq.equipo)}.png`);
      else if (tipo === 'qr-todos') await zipQR(todos, `equipos_${eq.modelo}`, (i, n) => { small.textContent = `Generando ${i} de ${n}…`; });
      else {
        const blob = await imagenMatriz({ equipo: eq, lubricantes: lubricantesDe(eq), url: urlUnidad(eq.id), logoBlanco: LOGO_BLANCO, src, lis: lisSrc });
        descargarBlob(blob, `Matriz_${nombreArchivo(eq.equipo)}.png`);
      }
      cerrarCapa(false);
      toast(tipo === 'qr-todos' ? 'ZIP descargado' : 'Imagen descargada');
    } catch (e) {
      console.error(e);
      small.textContent = antes;
      b.removeAttribute('aria-busy'); b.removeAttribute('data-ocupado');
      toast('No se pudo generar la descarga. Intente de nuevo.', 'error');
    }
  }));
}

function visor(url) {
  abrirCapa(`<div class="visor" data-fondo><button type="button" class="btn btn-icono cerrar" data-cerrar aria-label="Cerrar imagen">${I('x')}</button><img src="${esc(url)}" alt=""></div>`, { clase: 'oscuro' });
}

/* --------------------------------------------------------- Contraseña */
function pedirClave() {
  return new Promise((resolve) => {
    abrirCapa(`<form class="dialogo" id="f-clave" role="dialog" aria-modal="true" aria-labelledby="t-clave" novalidate>
      <div class="d-icono">${I('candado')}</div>
      <h2 id="t-clave">Acceso de edición</h2>
      <p>Para editar, crear matrices o ver el historial ingrese la contraseña.</p>
      <label class="campo"><span>Contraseña</span>
        <div class="clave-envoltura"><input type="password" id="clave" autocomplete="current-password" autocapitalize="none" spellcheck="false" required>
        <button type="button" class="btn btn-icono btn-fantasma btn-peq" id="ver-clave" aria-label="Mostrar contraseña" aria-pressed="false">${I('verClave')}</button></div>
      </label>
      <p class="error" id="err-clave" hidden></p>
      <div class="d-acciones"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button><button type="submit" class="btn btn-primario" id="b-clave">Ingresar</button></div>
    </form>`, { alCerrar: () => resolve(false) });
    const f = $('#f-clave'), inp = $('#clave'), err = $('#err-clave'), btn = $('#b-clave');
    $('#ver-clave').onclick = (e) => {
      const ver = inp.type === 'password';
      inp.type = ver ? 'text' : 'password';
      e.currentTarget.setAttribute('aria-pressed', String(ver));
    };
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!inp.value) { err.textContent = 'Escriba la contraseña.'; err.hidden = false; return; }
      btn.disabled = true; btn.textContent = 'Verificando…'; f.setAttribute('data-ocupado', '');
      let s = null;
      try { s = await abrirSesion(inp.value.trim(), estado.config); } catch (x) { console.error(x); }
      f.removeAttribute('data-ocupado');
      btn.disabled = false; btn.textContent = 'Ingresar';
      if (!s) {
        err.textContent = 'Contraseña incorrecta.'; err.hidden = false;
        f.classList.remove('agitar'); void f.offsetWidth; f.classList.add('agitar');
        inp.select();
        return;
      }
      estado.sesion = s;
      cerrarCapa(false);
      resolve(true);
    });
  });
}

function cerrarSesion() {
  estado.sesion = null;
  estado.editor = null;
  ir({ vista: 'inicio' });
  toast('Sesión de edición cerrada');
}

function barraAdmin(titulo, volver = { vista: 'inicio' }, extra = '') {
  return `<div class="barra"><div class="contenedor barra-in">
    <a class="btn btn-fantasma btn-icono" href="${esc(rutaURL(volver))}" data-volver='${esc(JSON.stringify(volver))}' aria-label="Volver">${I('izq')}</a>
    <span class="barra-titulo">${esc(titulo)}</span>
    ${extra}
    <button type="button" class="btn btn-fantasma btn-icono" data-accion="salir" aria-label="Cerrar sesión de edición" title="Cerrar sesión de edición">${I('salir')}</button>
  </div></div>`;
}
const bannerSinToken = () => (estado.sesion && !estado.sesion.token
  ? `<p class="banner">${I('info')}<span><b>Guardado en línea sin activar.</b> Puede revisar el formulario, pero para guardar debe configurar el token de GitHub (paso 4 de la guía, página <code>configurar.html</code>).</span></p>` : '');

/* ------------------------------------------------- Selección para editar */
function vistaSelector() {
  document.title = 'Editar matriz';
  app.innerHTML = `${barraAdmin('Editar matriz')}
  <section class="contenedor vista-admin">
    ${bannerSinToken()}
    <h1>¿Qué equipo desea editar?</h1>
    <p class="lead">Cada equipo tiene su propia matriz. Despliegue el modelo y seleccione el equipo.</p>
    ${htmlBuscador('Buscar equipo, modelo o flota')}
    <p class="conteo" id="conteo"></p>
    <ul class="tarjetas grupos" id="lista"></ul>
  </section>`;
  montarBuscador('editar');
}

/* ------------------------------------------------------------- Editor */
const CAMPOS_PUNTO = [
  ['componente', 'Componente', true], ['codigoLIS', 'Código lubricante (LIS)'], ['lubricante', 'Lubricante', false, 'doble'],
  ['cantidad', 'Cantidad total (gal)'], ['intervaloCambio', 'Intervalo de cambio de aceite'], ['intervaloMuestreo', 'Intervalo de muestreo (h)'],
  ['metodo', 'Método'], ['tarea', 'Tarea'], ['revisionNivel', 'Revisión de nivel'],
];
const puntoVacio = () => ({ componente: '', codigoLIS: '', lubricante: '', cantidad: '', tarea: 'Lubricado', intervaloCambio: '', metodo: 'Manual', intervaloMuestreo: '', revisionNivel: '' });
function equipoNuevo() {
  const t = plantilla();
  return {
    id: '', equipo: '', descripcion: '', modelo: '', flota: '', plantilla: '', activo: '', codigo: '', lugar: t.lugar || '', fechaElaboracion: hoyISO(), actualizado: null, imagen: '', foto: '',
    puntos: [puntoVacio()], fichas: [], advertencia: t.advertencia || '', primerosAuxilios: clonar(t.primerosAuxilios || {}),
    incendios: t.incendios || '', departamento: t.departamento || 'Departamento de Tribología',
  };
}

function vistaEditor(id) {
  const idRuta = id || '__nueva';
  let ed = estado.editor;
  if (!ed || ed.idRuta !== idRuta) {
    let original = null, borrador;
    if (id) {
      const eq = buscarEquipo(id);
      if (!eq) { toast('No se encontró la matriz seleccionada', 'error'); ir({ vista: 'editar' }, { reemplazar: true }); return; }
      original = clonar(eq); borrador = clonar(eq);
      borrador.primerosAuxilios = borrador.primerosAuxilios || {};
    } else borrador = equipoNuevo();
    ed = estado.editor = {
      idRuta, modo: id ? 'editar' : 'nuevo', original, borrador, aplicarA: new Set(),
      lubsOriginal: clonar(estado.datos.lubricantes || {}), lubs: clonar(estado.datos.lubricantes || {}), pendientes: {},
    };
  }
  const b = ed.borrador, pa = b.primerosAuxilios;
  const titulo = ed.modo === 'nuevo' ? 'Nueva matriz' : `Editar · ${ed.original.equipo}`;
  document.title = titulo;
  const valores = (k) => [...new Set(estado.datos.equipos.flatMap((e) => e.puntos.map((p) => p[k])).filter((v) => !vacio(v)))];
  const area = (campo, etq, valor, filas = 4) => `<label class="campo"><span>${etq}</span><textarea data-campo="${campo}" rows="${filas}">${esc(valor || '')}</textarea></label>`;

  app.innerHTML = `${barraAdmin(titulo, ed.modo === 'nuevo' ? { vista: 'inicio' } : { vista: 'editar' })}
  <form class="contenedor vista-admin" id="f-editor" novalidate>
    ${bannerSinToken()}
    <h1>${ed.modo === 'nuevo' ? 'Nueva matriz de equipo' : `Equipo ${esc(ed.original.equipo)}`}</h1>
    ${ed.modo === 'nuevo'
      ? `<p class="lead">Cada equipo tiene su propia matriz y su propio QR. Elija el equipo y, si quiere, copie la matriz de un equipo parecido.</p>
         <label class="campo" style="margin-top:16px"><span>Partir de (opcional)</span>
           <select id="copiar-de"><option value="">Matriz en blanco</option>
             <optgroup label="Equipos con matriz">${estado.datos.equipos.map((e) => `<option value="e:${esc(e.id)}">${esc(e.equipo)} · ${esc(e.modelo)}</option>`).join('')}</optgroup>
             <optgroup label="Matrices por modelo (Excel original)">${(estado.datos.plantillas || []).map((p) => `<option value="p:${esc(p.id)}">${esc(p.activo)}</option>`).join('')}</optgroup>
           </select>
           <small>Copia los puntos, lubricantes, fichas e imagen para ahorrar tiempo.</small></label>`
      : `<p class="nota-qr">${I('qr')}<span>Esta es la matriz solo del equipo ${esc(b.equipo)}. Su QR se conserva aunque cambie los datos (<code>?u=${esc(b.id)}</code>).</span></p>`}
    <div id="errores"></div>

    <fieldset class="ed-seccion"><legend>Datos del equipo</legend>
      <div class="rejilla rejilla-2">
        <label class="campo"><span>Equipo (código IH08) <span class="req">*</span></span><input data-campo="equipo" value="${esc(b.equipo)}" ${ed.modo === 'nuevo' ? 'list="dl-ih08" required' : 'readonly'} autocomplete="off" placeholder="Ej.: T013" autocapitalize="characters">
          ${ed.modo === 'nuevo' ? '<small>Escriba o elija un equipo del IH08 que aún no tenga matriz.</small>' : '<small>El código del equipo no se puede cambiar: es el que usa su QR.</small>'}</label>
        <label class="campo"><span>Descripción</span><input data-campo="descripcion" value="${esc(b.descripcion || '')}" autocomplete="off"></label>
        <label class="campo"><span>Modelo</span><input data-campo="modelo" value="${esc(b.modelo || '')}" list="dl-modelos" autocomplete="off"></label>
        <label class="campo"><span>Flota</span><input data-campo="flota" value="${esc(b.flota || '')}" list="dl-flotas" autocomplete="off"></label>
        <label class="campo"><span>Nombre de la matriz</span><input data-campo="activo" value="${esc(b.activo || '')}" autocomplete="off" placeholder="Ej.: TH430 SANDVIK"></label>
        <label class="campo"><span>Lugar</span><input data-campo="lugar" value="${esc(b.lugar)}" autocomplete="off"></label>
        <label class="campo"><span>Fecha de elaboración</span><input type="date" data-campo="fechaElaboracion" value="${esc(b.fechaElaboracion || '')}"></label>
      </div>
    </fieldset>
    <datalist id="dl-ih08">${(estado.datos.ih08 || []).filter((u) => !buscarEquipo(u.equipo)).map((u) => `<option value="${esc(u.equipo)}">${esc([u.modelo, u.descripcion].filter(Boolean).join(' · '))}</option>`).join('')}</datalist>
    <datalist id="dl-modelos">${unicos(estado.datos.equipos.map((e) => e.modelo)).map((v) => `<option value="${esc(v)}">`).join('')}</datalist>
    <datalist id="dl-flotas">${unicos(estado.datos.equipos.map((e) => e.flota)).map((v) => `<option value="${esc(v)}">`).join('')}</datalist>

    <fieldset class="ed-seccion"><legend>Imagen de puntos de lubricación</legend>
      <div id="ed-img"></div>
    </fieldset>

    <fieldset class="ed-seccion"><legend>Foto del equipo (pantalla de inicio)</legend>
      <div id="ed-foto"></div>
    </fieldset>

    <fieldset class="ed-seccion"><legend>Puntos de cambio de aceite</legend>
      <div id="ed-puntos"></div>
      <button type="button" class="btn btn-sec ancho" data-accion="agregar-punto" style="margin-bottom:16px">${I('mas')} Agregar punto</button>
    </fieldset>

    <fieldset class="ed-seccion"><legend>Imágenes de lubricantes</legend>
      <p class="ayuda">Se listan los lubricantes usados en los puntos. La imagen de cada lubricante se comparte con todas las matrices que lo usan.</p>
      <div id="ed-lubs"></div>
    </fieldset>

    <fieldset class="ed-seccion"><legend>Fichas técnicas de lubricantes</legend>
      <p class="ayuda">Enlaces a la ficha técnica de cada lubricante. En la matriz aparecen como botón «Ficha técnica».</p>
      <div id="ed-fichas"></div>
      <button type="button" class="btn btn-sec ancho" data-accion="agregar-ficha" style="margin-bottom:16px">${I('mas')} Agregar ficha técnica</button>
    </fieldset>

    <fieldset class="ed-seccion"><legend>Seguridad</legend>
      ${area('advertencia', 'Advertencia', b.advertencia, 6)}
      <div class="rejilla rejilla-2">
        ${area('primerosAuxilios.ojos', 'Primeros auxilios · Ojos', pa.ojos)}
        ${area('primerosAuxilios.piel', 'Primeros auxilios · Piel', pa.piel)}
        ${area('primerosAuxilios.ingestion', 'Primeros auxilios · Ingestión', pa.ingestion)}
        ${area('primerosAuxilios.inhalacion', 'Primeros auxilios · Inhalación', pa.inhalacion)}
      </div>
      ${area('primerosAuxilios.nota', 'Nota de primeros auxilios', pa.nota, 3)}
      ${area('incendios', 'Medida contra incendios', b.incendios, 3)}
      <label class="campo"><span>Departamento responsable</span><input data-campo="departamento" value="${esc(b.departamento || '')}"></label>
    </fieldset>

    <fieldset class="ed-seccion"><legend>Aplicar también a otros equipos (opcional)</legend>
      <p class="ayuda">Por defecto solo se guarda la matriz de este equipo. Si marca otros equipos, se les copian los puntos, lubricantes, fichas, imagen de puntos y seguridad de esta matriz. Sus datos de equipo y su foto no cambian.</p>
      <div id="ed-unidades"></div>
    </fieldset>

    <datalist id="dl-lub">${[...catalogoLubricantes().values()].map((l) => `<option value="${esc(l.nombre)}">${esc(l.lis)}</option>`).join('')}</datalist>
    <datalist id="dl-lis">${Object.keys(estado.datos.lis || {}).map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
    <datalist id="dl-metodo">${valores('metodo').map((v) => `<option value="${esc(v)}">`).join('')}</datalist>
    <datalist id="dl-tarea">${valores('tarea').map((v) => `<option value="${esc(v)}">`).join('')}</datalist>

    ${ed.modo === 'editar' ? `<fieldset class="ed-seccion zona-peligro"><legend>Eliminar matriz</legend>
      <p class="ayuda">Elimina por completo la matriz del equipo ${esc(ed.original.equipo)}: deja de aparecer en el inicio y su QR mostrará «sin matriz». ${delModelo(ed.original.modelo).length <= 1 ? `Es el único equipo del modelo ${esc(ed.original.modelo || '')}, así que el modelo también desaparece del inicio.` : `El modelo ${esc(ed.original.modelo || '')} sigue con ${delModelo(ed.original.modelo).length - 1} equipo${delModelo(ed.original.modelo).length - 1 === 1 ? '' : 's'}.`} La eliminación queda en el historial y la matriz se puede volver a crear con «Nueva matriz».</p>
      <button type="button" class="btn btn-sec btn-peligro" data-accion="eliminar-matriz">${I('basura')} Eliminar la matriz de ${esc(ed.original.equipo)}</button>
    </fieldset>` : ''}

    <div class="ed-acciones"><div class="contenedor">
      <button type="button" class="btn btn-fantasma" data-accion="cancelar-edicion">Cancelar</button>
      <button type="submit" class="btn btn-primario">${I('check')} Guardar cambios</button>
    </div></div>
  </form>`;
  b.fichas = b.fichas || [];
  pintarImagenEditor();
  pintarFotoEditor();
  pintarUnidadesEditor();
  pintarPuntosEditor();
  pintarLubsEditor();
  pintarFichasEditor();

  const f = $('#f-editor');
  f.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.campo) {
      const [a, k] = t.dataset.campo.split('.');
      if (k) b[a][k] = t.value; else b[a] = t.value;
      t.closest('.campo')?.classList.remove('invalido');
      if (a === 'equipo' && ed.modo === 'nuevo') {
        b.equipo = t.value = t.value.toUpperCase().trim();
        const u = mapaIH08().get(b.equipo);
        if (u) {
          ['descripcion', 'modelo', 'flota'].forEach((c) => { if (u[c]) { b[c] = u[c]; $(`[data-campo="${c}"]`).value = u[c]; } });
        }
        pintarUnidadesEditor();
      }
      if (a === 'modelo') pintarUnidadesEditor();
    } else if (t.dataset.k) {
      const i = +t.closest('[data-i]').dataset.i;
      b.puntos[i][t.dataset.k] = t.value;
      t.closest('.campo')?.classList.remove('invalido');
      if (t.dataset.k === 'componente') t.closest('.ed-punto').querySelector('.ed-punto-cab b').textContent = t.value || `Punto ${i + 1}`;
      if (t.dataset.k === 'codigoLIS') { const pv = t.closest('.campo').querySelector('[data-lis-prev]'); if (pv) pv.innerHTML = lisImg(t.value) || (vacio(t.value) ? '' : '<small>Sin color registrado</small>'); }
    } else if (t.id === 'u-buscar') {
      pintarUnidadesEditor();
    } else if (t.dataset.fk) {
      b.fichas[+t.closest('[data-f]').dataset.f][t.dataset.fk] = t.value;
      t.closest('.campo')?.classList.remove('invalido');
    }
  });
  f.addEventListener('change', (e) => {
    if (e.target.dataset.k === 'lubricante') {
      const i = +e.target.closest('[data-i]').dataset.i;
      if (!autocompletarLubricante(i)) pintarLubsEditor();
    }
    if (e.target.matches('input[type=file]')) cargarImagenEditor(e.target);
    if (e.target.dataset.unidad) {
      if (e.target.checked) ed.aplicarA.add(e.target.dataset.unidad); else ed.aplicarA.delete(e.target.dataset.unidad);
      pintarUnidadesEditor();
    }
  });
  const copiar = $('#copiar-de');
  if (copiar) copiar.addEventListener('change', () => {
    const [tipo, oid] = copiar.value.split(/:(.*)/s);
    const o = tipo === 'p' ? (estado.datos.plantillas || []).find((x) => x.id === oid) : buscarEquipo(oid);
    if (!o) return;
    ['puntos', 'fichas', 'primerosAuxilios'].forEach((k) => { b[k] = clonar(o[k] || (k === 'primerosAuxilios' ? {} : [])); });
    ['imagen', 'advertencia', 'incendios', 'departamento', 'activo'].forEach((k) => { b[k] = o[k] || ''; });
    if (!b.foto && o.foto) b.foto = o.foto;
    b.plantilla = tipo === 'p' ? o.id : (o.plantilla || '');
    if (tipo === 'e') { ['modelo', 'flota'].forEach((k) => { if (!b[k] && o[k]) b[k] = o[k]; }); }
    vistaEditor(null);
    toast(`Se copiaron ${o.puntos.length} puntos de ${o.equipo || o.activo}`);
  });
  f.addEventListener('submit', (e) => { e.preventDefault(); validarYRegistrar(); });
}

function pintarImagenEditor() {
  const b = estado.editor.borrador;
  $('#ed-img').innerHTML = `
    ${b.imagen ? `<div class="ed-imagen"><img src="${esc(src(b.imagen))}" alt="Imagen actual de puntos de lubricación"></div>`
      : '<div class="m-sin-imagen" style="margin-bottom:12px">' + I('imagen') + '<span>Sin imagen. Suba una foto o diagrama con los puntos numerados.</span></div>'}
    <div class="fila-botones">
      <label class="btn btn-sec">${I('imagen')} ${b.imagen ? 'Cambiar imagen' : 'Subir imagen'}<input type="file" accept="image/*" data-img="equipo" class="visual-oculto"></label>
      ${b.imagen ? `<button type="button" class="btn btn-peligro" data-accion="quitar-img">${I('basura')} Quitar</button>` : ''}
    </div>`;
}

/** Lubricantes ya registrados: nombre oficial, código LIS y ficha técnica más usados. */
function catalogoLubricantes() {
  if (estado._catDe === estado.datos) return estado._cat;
  const m = new Map();
  const cuenta = (obj, k) => { if (k) obj[k] = (obj[k] || 0) + 1; };
  [...estado.datos.equipos, ...(estado.datos.plantillas || [])].forEach((e) => {
    const fichas = new Map((e.fichas || []).filter((f) => f.url).map((f) => [clave(f.nombre), f.url]));
    (e.puntos || []).forEach((p) => {
      const n = String(p.lubricante || '').trim();
      if (!n || esNA(n)) return;
      const k = clave(n);
      if (!m.has(k)) m.set(k, { nombres: {}, lis: {}, fichas: {} });
      const x = m.get(k);
      cuenta(x.nombres, n);
      if (!esNA(p.codigoLIS)) cuenta(x.lis, String(p.codigoLIS || '').trim());
      cuenta(x.fichas, fichas.get(k));
    });
  });
  const mayor = (o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const cat = new Map();
  m.forEach((x, k) => cat.set(k, { nombre: mayor(x.nombres), lis: mayor(x.lis), ficha: mayor(x.fichas) }));
  (Object.entries(estado.datos.lubricantes || {})).forEach(([k, l]) => { if (!cat.has(k)) cat.set(k, { nombre: l.nombre, lis: '', ficha: '' }); });
  estado._catDe = estado.datos; estado._cat = cat;
  return cat;
}

/** Al escribir un lubricante ya registrado completa LIS, nombre oficial y ficha técnica. */
function autocompletarLubricante(i) {
  const ed = estado.editor, b = ed.borrador, p = b.puntos[i];
  const info = catalogoLubricantes().get(clave(p.lubricante || ''));
  if (!info) return false;
  const hechos = [];
  if (info.nombre && p.lubricante !== info.nombre) p.lubricante = info.nombre;
  if (info.lis && p.codigoLIS !== info.lis) { p.codigoLIS = info.lis; hechos.push(`código LIS ${info.lis}`); }
  b.fichas = b.fichas || [];
  if (info.ficha && !b.fichas.some((f) => clave(f.nombre) === clave(info.nombre))) {
    b.fichas.push({ nombre: info.nombre, url: info.ficha });
    hechos.push('ficha técnica');
  }
  if ((estado.datos.lubricantes || {})[clave(info.nombre)]?.imagen || (ed.lubs[clave(info.nombre)] || {}).imagen) hechos.push('imagen');
  pintarPuntosEditor(); pintarLubsEditor(); pintarFichasEditor();
  if (hechos.length) toast(`${info.nombre}: se completó ${hechos.join(', ')}`);
  return true;
}

function pintarPuntosEditor() {
  const b = estado.editor.borrador, n = b.puntos.length;
  $('#ed-puntos').innerHTML = b.puntos.map((p, i) => `
    <div class="ed-punto" data-i="${i}">
      <div class="ed-punto-cab"><span class="num">${i + 1}</span><b>${esc(p.componente || `Punto ${i + 1}`)}</b>
        <div class="ed-punto-ctrl">
          <button type="button" class="btn btn-icono btn-fantasma btn-peq" data-accion="subir-punto" ${i === 0 ? 'disabled' : ''} aria-label="Subir punto ${i + 1}">${I('arriba')}</button>
          <button type="button" class="btn btn-icono btn-fantasma btn-peq" data-accion="bajar-punto" ${i === n - 1 ? 'disabled' : ''} aria-label="Bajar punto ${i + 1}">${I('abajo')}</button>
          <button type="button" class="btn btn-icono btn-peligro btn-peq" data-accion="borrar-punto" aria-label="Eliminar punto ${i + 1}">${I('basura')}</button>
        </div></div>
      <div class="rejilla rejilla-pts">
        ${CAMPOS_PUNTO.map(([k, etq, req, cls]) => `<label class="campo ${cls || ''}"><span>${etq}${req ? ' <span class="req">*</span>' : ''}</span>
          <input data-k="${k}" value="${esc(p[k] || '')}" autocomplete="off" ${k === 'lubricante' ? 'list="dl-lub"' : k === 'metodo' ? 'list="dl-metodo"' : k === 'tarea' ? 'list="dl-tarea"' : ''}
          ${k === 'cantidad' ? 'inputmode="decimal" placeholder="Ej.: 4,5"' : k === 'intervaloCambio' ? 'placeholder="Ej.: 500 h"' : k === 'intervaloMuestreo' ? 'placeholder="Ej.: 250"' : k === 'codigoLIS' ? 'list="dl-lis"' : ''}>
          ${k === 'codigoLIS' ? `<span class="lis-prev" data-lis-prev>${lisImg(p.codigoLIS) || (vacio(p.codigoLIS) ? '' : '<small>Sin color registrado</small>')}</span>` : ''}
          ${k === 'lubricante' ? '<small>Si elige un lubricante registrado se completan el código LIS y la ficha técnica.</small>' : ''}</label>`).join('')}
      </div>
    </div>`).join('');
}

function pintarFotoEditor() {
  const b = estado.editor.borrador;
  $('#ed-foto').innerHTML = `
    <div class="ed-lub" style="border:0">
      <span class="miniatura foto" style="width:96px;height:96px">${b.foto ? `<img src="${esc(src(b.foto))}" alt="Foto actual">` : I('equipo')}</span>
      <div><b>${b.foto ? 'Foto actual' : 'Sin foto'}</b><small>Se muestra en la tarjeta del equipo en el inicio. Si no hay foto se usa la imagen de puntos.</small></div>
    </div>
    <div class="fila-botones">
      <label class="btn btn-sec">${I('imagen')} ${b.foto ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" data-img="foto" class="visual-oculto"></label>
      ${b.foto ? `<button type="button" class="btn btn-peligro" data-accion="quitar-foto">${I('basura')} Quitar</button>` : ''}
    </div>`;
}

function pintarUnidadesEditor() {
  const ed = estado.editor, b = ed.borrador, caja = $('#ed-unidades');
  if (!caja) return;
  if (!$('#u-buscar', caja)) {
    caja.innerHTML = `<p class="ayuda" id="u-cuenta"></p>
      <div class="filtro-buscar" style="padding:0 0 8px">${I('buscar', 'i-peq')}<input id="u-buscar" type="search" placeholder="Buscar equipo, modelo o flota" autocomplete="off"></div>
      <ul class="filtro-opciones u-lista" id="u-lista"></ul>`;
  }
  const sel = ed.aplicarA;
  const qn = sinAcentos($('#u-buscar').value).toLowerCase();
  const lista = estado.datos.equipos.filter((e) => e.id !== b.id && e.equipo !== b.equipo)
    .filter((e) => (qn ? sinAcentos(`${e.equipo} ${e.modelo} ${e.flota} ${e.descripcion}`).toLowerCase().includes(qn) : e.modelo === b.modelo || sel.has(e.id)))
    .sort((x, y) => (sel.has(y.id) - sel.has(x.id)) || ((y.modelo === b.modelo) - (x.modelo === b.modelo)) || x.equipo.localeCompare(y.equipo, 'es', { numeric: true }));
  $('#u-cuenta').innerHTML = sel.size
    ? `Se aplicará también a <b>${sel.size}</b> equipo${sel.size === 1 ? '' : 's'}: ${esc([...sel].join(', '))}`
    : `Solo se guardará el equipo <b>${esc(b.equipo || '(nuevo)')}</b>.${b.modelo ? ` Abajo están los demás ${esc(b.modelo)}; busque para ver otros modelos.` : ''}`;
  $('#u-lista').innerHTML = lista.slice(0, 250).map((u) => `<li><label class="opcion-f">
      <input type="checkbox" data-unidad="${esc(u.id)}" ${sel.has(u.id) ? 'checked' : ''}>
      <span>${esc(u.equipo)} <small>${esc([u.modelo, u.flota].filter(Boolean).join(' · '))}</small></span>
      ${b.equipo && ed.original ? (firma(u) !== firma(ed.original) ? '<span class="cnt">matriz distinta</span>' : '<span class="cnt">misma matriz</span>') : ''}</label></li>`).join('') || '<li class="filtro-vacio">Sin equipos para mostrar. Busque por código o modelo.</li>';
}

function pintarFichasEditor() {
  const f = estado.editor.borrador.fichas;
  $('#ed-fichas').innerHTML = f.length ? f.map((x, i) => `
    <div class="ed-punto" data-f="${i}">
      <div class="ed-punto-cab"><span class="num">${i + 1}</span><b>${esc(x.nombre || 'Ficha técnica')}</b>
        <div class="ed-punto-ctrl"><button type="button" class="btn btn-icono btn-peligro btn-peq" data-accion="borrar-ficha" aria-label="Eliminar ficha ${i + 1}">${I('basura')}</button></div></div>
      <div class="rejilla rejilla-2">
        <label class="campo"><span>Lubricante</span><input data-fk="nombre" value="${esc(x.nombre || '')}" list="dl-lub" autocomplete="off"></label>
        <label class="campo"><span>Enlace (https://…)</span><input data-fk="url" value="${esc(x.url || '')}" type="url" inputmode="url" autocomplete="off" spellcheck="false"></label>
      </div>
    </div>`).join('') : '<p class="ayuda">Sin fichas técnicas.</p>';
}

function pintarLubsEditor() {
  const ed = estado.editor;
  const lubs = lubricantesDe(ed.borrador, ed.lubs);
  $('#ed-lubs').innerHTML = lubs.length ? lubs.map((l) => `
    <div class="ed-lub">
      <span class="miniatura">${l.imagen ? `<img src="${esc(src(l.imagen))}" alt="">` : I('gota')}</span>
      <div><b>${esc(l.nombre)}</b><small>Punto${l.puntos.length > 1 ? 's' : ''} ${l.puntos.join(', ')}</small></div>
      <div class="fila-botones">
        <label class="btn btn-sec btn-peq">${I('imagen')} ${l.imagen ? 'Cambiar' : 'Subir'}<input type="file" accept="image/*" data-img="lub" data-clave="${esc(l.clave)}" data-nombre="${esc(l.nombre)}" class="visual-oculto"></label>
        ${l.imagen ? `<button type="button" class="btn btn-icono btn-peligro btn-peq" data-accion="quitar-img-lub" data-clave="${esc(l.clave)}" aria-label="Quitar imagen de ${esc(l.nombre)}">${I('basura')}</button>` : ''}
      </div>
    </div>`).join('') : '<p class="ayuda">Aún no hay lubricantes en los puntos.</p>';
}

async function cargarImagenEditor(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const ed = estado.editor;
  try {
    toast('Procesando imagen…');
    const r = await procesarImagen(file, input.dataset.img === 'lub' || input.dataset.img === 'foto' ? { maxLado: 900 } : {});
    const marca = Date.now().toString(36);
    if (input.dataset.img === 'foto') {
      const ruta = `img/fotos/${clave(ed.borrador.activo) || 'equipo'}-${marca}.jpg`;
      ed.pendientes[ruta] = r;
      estado.imagenesLocales[ruta] = r.url;
      ed.borrador.foto = ruta;
      pintarFotoEditor();
    } else if (input.dataset.img === 'equipo') {
      const ruta = `img/equipos/${clave(ed.borrador.activo) || 'equipo'}-${marca}.jpg`;
      ed.pendientes[ruta] = r;
      estado.imagenesLocales[ruta] = r.url;
      ed.borrador.imagen = ruta;
      pintarImagenEditor();
    } else {
      const k = input.dataset.clave;
      const ruta = `img/lubricantes/${k}-${marca}.jpg`;
      ed.pendientes[ruta] = r;
      estado.imagenesLocales[ruta] = r.url;
      ed.lubs[k] = { nombre: input.dataset.nombre, ...(ed.lubs[k] || {}), imagen: ruta };
      pintarLubsEditor();
    }
    toast('Imagen lista. Se subirá al guardar.');
  } catch (e) {
    toast(e.message || 'No se pudo cargar la imagen', 'error');
  }
}

/* --------------------------------------------------- Cambios realizados */
const ETQ = { descripcion: 'Descripción', modelo: 'Modelo', flota: 'Flota', activo: 'Nombre de la matriz', lugar: 'Lugar', fechaElaboracion: 'Fecha de elaboración', departamento: 'Departamento' };
/** Contenido de la matriz que se copia al «aplicar también a» otros equipos. */
const CONTENIDO = ['puntos', 'fichas', 'imagen', 'advertencia', 'primerosAuxilios', 'incendios', 'departamento', 'activo'];
const ETQ_TXT = { advertencia: 'Advertencia', incendios: 'Medida contra incendios' };
const ETQ_PA = { ojos: 'Ojos', piel: 'Piel', ingestion: 'Ingestión', inhalacion: 'Inhalación', nota: 'Nota' };
const ETQ_P = Object.fromEntries(CAMPOS_PUNTO.map(([k, e]) => [k, e]));
const norm = (v) => String(v ?? '').trim();
const fmt = (v) => (norm(v) ? `"${norm(v)}"` : '(vacío)');

function calcularCambios(ed) {
  const a = ed.original, b = ed.borrador, out = [];
  if (!a) {
    out.push(`Creación de la matriz del equipo ${norm(b.equipo)} con ${b.puntos.length} punto${b.puntos.length === 1 ? '' : 's'}: ${b.puntos.map((p) => norm(p.componente) || '—').join(', ')}`);
    if (b.imagen) out.push('Imagen de puntos de lubricación agregada');
  } else {
    Object.keys(ETQ).forEach((k) => { if (norm(a[k]) !== norm(b[k])) out.push(`${ETQ[k]}: ${fmt(a[k])} → ${fmt(b[k])}`); });
    if (norm(a.imagen) !== norm(b.imagen)) out.push(!b.imagen ? 'Imagen de puntos de lubricación eliminada' : a.imagen ? 'Imagen de puntos de lubricación reemplazada' : 'Imagen de puntos de lubricación agregada');
    const n = Math.max(a.puntos.length, b.puntos.length);
    for (let i = 0; i < n; i++) {
      const pa = a.puntos[i], pb = b.puntos[i];
      if (!pa) out.push(`Punto ${i + 1} agregado: ${norm(pb.componente) || '—'}${norm(pb.lubricante) ? ` (${norm(pb.lubricante)})` : ''}`);
      else if (!pb) out.push(`Punto ${i + 1} eliminado: ${norm(pa.componente) || '—'}`);
      else Object.keys(ETQ_P).forEach((k) => {
        if (norm(pa[k]) !== norm(pb[k])) out.push(`Punto ${i + 1} (${norm(pb.componente) || norm(pa.componente)}) · ${ETQ_P[k]}: ${fmt(pa[k])} → ${fmt(pb[k])}`);
      });
    }
    Object.keys(ETQ_TXT).forEach((k) => { if (norm(a[k]) !== norm(b[k])) out.push(`${ETQ_TXT[k]}: texto modificado`); });
    if (norm(a.foto) !== norm(b.foto)) out.push(!b.foto ? 'Foto del equipo eliminada' : a.foto ? 'Foto del equipo reemplazada' : 'Foto del equipo agregada');
    const fA = JSON.stringify((a.fichas || []).map((f) => [norm(f.nombre), norm(f.url)]));
    const fB = JSON.stringify((b.fichas || []).map((f) => [norm(f.nombre), norm(f.url)]));
    if (fA !== fB) out.push(`Fichas técnicas modificadas (${(a.fichas || []).length} → ${(b.fichas || []).length})`);
    const paA = a.primerosAuxilios || {}, paB = b.primerosAuxilios || {};
    Object.keys(ETQ_PA).forEach((k) => { if (norm(paA[k]) !== norm(paB[k])) out.push(`Primeros auxilios · ${ETQ_PA[k]}: texto modificado`); });
  }
  lubsCambiados(ed).forEach((k) => {
    const antes = (ed.lubsOriginal[k] || {}).imagen, ahora = (ed.lubs[k] || {}).imagen;
    out.push(`Imagen del lubricante ${(ed.lubs[k] || ed.lubsOriginal[k]).nombre}: ${!ahora ? 'eliminada' : antes ? 'reemplazada' : 'agregada'}`);
  });
  if (ed.aplicarA && ed.aplicarA.size) out.push(`Contenido de la matriz aplicado también a: ${[...ed.aplicarA].join(', ')}`);
  return out;
}
function lubsCambiados(ed) {
  const ks = new Set([...Object.keys(ed.lubs), ...Object.keys(ed.lubsOriginal)]);
  return [...ks].filter((k) => norm((ed.lubs[k] || {}).imagen) !== norm((ed.lubsOriginal[k] || {}).imagen));
}

function validarYRegistrar() {
  const ed = estado.editor, b = ed.borrador, errores = [];
  $$('.campo.invalido').forEach((c) => c.classList.remove('invalido'));
  if (!norm(b.equipo)) { errores.push('Escriba el código del equipo.'); $('[data-campo="equipo"]').closest('.campo').classList.add('invalido'); }
  if (!b.puntos.length) errores.push('Agregue al menos un punto de cambio de aceite.');
  b.puntos.forEach((p, i) => {
    if (!norm(p.componente)) { errores.push(`Punto ${i + 1}: escriba el componente.`); $(`[data-i="${i}"] [data-k="componente"]`).closest('.campo').classList.add('invalido'); }
  });
  (b.fichas || []).forEach((f, i) => {
    if (norm(f.url) && !/^https?:\/\//i.test(norm(f.url))) { errores.push(`Ficha técnica ${i + 1}: el enlace debe empezar por https://`); $(`[data-f="${i}"] [data-fk="url"]`).closest('.campo').classList.add('invalido'); }
  });
  if (ed.modo === 'nuevo' && norm(b.equipo) && buscarEquipo(norm(b.equipo))) {
    errores.push(`El equipo ${norm(b.equipo)} ya tiene matriz. Edítela desde «Editar matriz».`);
    $('[data-campo="equipo"]').closest('.campo').classList.add('invalido');
  }
  if (ed.modo === 'nuevo' && norm(b.equipo) && !/^[A-Za-z0-9._-]+$/.test(norm(b.equipo))) errores.push('El código del equipo solo puede tener letras, números, punto, guion o guion bajo.');
  const caja = $('#errores');
  if (errores.length) {
    caja.innerHTML = `<div class="errores" role="alert"><b>Revise antes de guardar:</b><ul>${errores.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
    caja.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  caja.innerHTML = '';
  const cambios = calcularCambios(ed);
  if (!cambios.length) { toast('No hay cambios para guardar'); return; }
  dialogoRegistro(cambios);
}

function dialogoRegistro(cambios) {
  const ed = estado.editor;
  const fecha = ahoraISO();
  abrirCapa(`<form class="dialogo dialogo-ancho" id="f-registro" role="dialog" aria-modal="true" aria-labelledby="t-reg" novalidate>
    <div class="d-icono">${I('doc')}</div>
    <h2 id="t-reg">Registro del cambio</h2>
    <p>Antes de guardar, identifíquese. Estos datos quedan en el historial de cambios.</p>
    <label class="campo"><span>Nombre de la persona que actualiza <span class="req">*</span></span><input id="r-nombre" autocomplete="name" required></label>
    <label class="campo"><span>Documento de identificación <span class="req">*</span></span><input id="r-doc" autocomplete="off" required></label>
    <label class="campo"><span>Justificación del cambio <span class="req">*</span></span><textarea id="r-just" rows="3" required placeholder="Ej.: Actualización según manual del fabricante / recomendación de análisis de aceite / cambio de lubricante aprobado"></textarea><small>Explique por qué se hace el cambio. Queda en el historial.</small></label>
    <div class="resumen">
      <h3>Se registra automáticamente</h3>
      <dl>
        <dt>Fecha</dt><dd>${esc(fechaHora(fecha))}</dd>
        <dt>Matriz</dt><dd>Equipo ${esc(ed.borrador.equipo)} · ${ed.modo === 'nuevo' ? 'creación' : 'actualización'}</dd>
        ${ed.aplicarA.size ? `<dt>También a</dt><dd>${esc([...ed.aplicarA].join(', '))}</dd>` : ''}
      </dl>
      <h3>Cambios realizados (${cambios.length})</h3>
      <ul class="cambios">${cambios.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>
    <p class="error" id="r-error" hidden></p>
    <div id="r-progreso"></div>
    <div class="d-acciones"><button type="button" class="btn btn-fantasma" data-cerrar>Volver a editar</button><button type="submit" class="btn btn-primario" id="r-ok">${I('check')} Confirmar y guardar</button></div>
  </form>`);
  const f = $('#f-registro');
  f.addEventListener('input', (e) => { e.target.closest('.campo')?.classList.remove('invalido'); $('#r-error').hidden = true; });
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = norm($('#r-nombre').value), doc = norm($('#r-doc').value), just = norm($('#r-just').value), err = $('#r-error');
    $$('.campo', f).forEach((c) => c.classList.remove('invalido'));
    const faltan = [];
    if (nombre.length < 3) { faltan.push('el nombre completo'); $('#r-nombre').closest('.campo').classList.add('invalido'); }
    if (doc.length < 4) { faltan.push('el documento de identificación'); $('#r-doc').closest('.campo').classList.add('invalido'); }
    if (just.length < 10) { faltan.push('la justificación (mínimo 10 caracteres)'); $('#r-just').closest('.campo').classList.add('invalido'); }
    if (faltan.length) { err.textContent = `Falta ${faltan.length > 1 ? `${faltan.slice(0, -1).join(', ')} y ${faltan.at(-1)}` : faltan[0]}.`; err.hidden = false; return; }
    err.hidden = true;
    const btn = $('#r-ok');
    btn.disabled = true; f.setAttribute('data-ocupado', '');
    $$('[data-cerrar]', f).forEach((x) => { x.disabled = true; });
    const prog = (t) => { $('#r-progreso').innerHTML = `<p class="progreso"><span class="giro" aria-hidden="true"></span>${esc(t)}</p>`; };
    try {
      const eq = await guardarEnGitHub(ed, { nombre, documento: doc, justificacion: just, accion: ed.modo === 'nuevo' ? 'Creación' : 'Actualización', matriz: norm(ed.borrador.equipo), aplicadoA: [...ed.aplicarA], cambios }, prog);
      estado.editor = null;
      dialogoExito(eq, ed.modo);
    } catch (x) {
      console.error(x);
      $('#r-progreso').innerHTML = '';
      err.textContent = x.message || 'No se pudo guardar. Intente de nuevo.';
      err.hidden = false;
      btn.disabled = false; f.removeAttribute('data-ocupado');
      $$('[data-cerrar]', f).forEach((y) => { y.disabled = false; });
    }
  });
}

function dialogoExito(eq, modo) {
  abrirCapa(`<div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="t-ok">
    <div class="d-icono ok">${I('check')}</div>
    <h2 id="t-ok">${modo === 'nuevo' ? 'Matriz creada' : 'Cambios guardados'}</h2>
    <p>La matriz del equipo ${esc(eq.equipo)} quedó guardada y registrada en el historial. Los técnicos verán la actualización en 1 a 2 minutos, el tiempo que tarda GitHub en publicarla.</p>
    ${modo === 'nuevo' ? '<p>Descargue el código QR desde la matriz para imprimirlo y pegarlo en el equipo.</p>' : ''}
    <div class="d-acciones"><button type="button" class="btn btn-fantasma" id="ok-inicio">Ir al inicio</button><button type="button" class="btn btn-primario" id="ok-ver">Ver matriz</button></div>
  </div>`, { alCerrar: () => ir({ vista: 'unidad', codigo: eq.id }) });
  $('#ok-ver').onclick = () => { cerrarCapa(false); ir({ vista: 'unidad', codigo: eq.id }); };
  $('#ok-inicio').onclick = () => { cerrarCapa(false); ir({ vista: 'inicio' }); };
}

/* ---------------------------------------------------- Eliminar matriz */
function dialogoEliminar() {
  const ed = estado.editor, eq = ed.original;
  const resto = delModelo(eq.modelo).filter((e) => e.id !== eq.id).length;
  const fecha = ahoraISO();
  const cambios = [`Eliminación de la matriz del equipo ${eq.equipo}${eq.modelo ? ` (modelo ${eq.modelo})` : ''} con ${eq.puntos.length} punto${eq.puntos.length === 1 ? '' : 's'}: ${eq.puntos.map((p) => norm(p.componente) || '—').join(', ')}`];
  if (!resto && eq.modelo) cambios.push(`El modelo ${eq.modelo} quedó sin equipos y deja de mostrarse en el inicio`);
  abrirCapa(`<form class="dialogo dialogo-ancho" id="f-eliminar" role="dialog" aria-modal="true" aria-labelledby="t-del" novalidate>
    <div class="d-icono peligro">${I('basura')}</div>
    <h2 id="t-del">Eliminar la matriz de ${esc(eq.equipo)}</h2>
    <p>La matriz se borra de la página. El QR de ${esc(eq.equipo)} mostrará «sin matriz» hasta que alguien la vuelva a crear.${!resto && eq.modelo ? ` <b>${esc(eq.modelo)} es el último equipo de su modelo: el modelo desaparece del inicio.</b>` : ''}</p>
    <label class="campo"><span>Para confirmar, escriba el código del equipo (${esc(eq.equipo)}) <span class="req">*</span></span><input id="e-codigo" autocomplete="off" autocapitalize="characters" required></label>
    <label class="campo"><span>Nombre de la persona que elimina <span class="req">*</span></span><input id="e-nombre" autocomplete="name" required></label>
    <label class="campo"><span>Documento de identificación <span class="req">*</span></span><input id="e-doc" autocomplete="off" required></label>
    <label class="campo"><span>Justificación de la eliminación <span class="req">*</span></span><textarea id="e-just" rows="3" required placeholder="Ej.: Equipo dado de baja / vendido / trasladado de proyecto / matriz creada por error"></textarea><small>Queda en el historial.</small></label>
    <div class="resumen">
      <h3>Se registra automáticamente</h3>
      <dl><dt>Fecha</dt><dd>${esc(fechaHora(fecha))}</dd><dt>Matriz</dt><dd>Equipo ${esc(eq.equipo)} · eliminación</dd></dl>
      <h3>Cambios realizados</h3>
      <ul class="cambios">${cambios.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>
    <p class="error" id="e-error" hidden></p>
    <div id="e-progreso"></div>
    <div class="d-acciones"><button type="button" class="btn btn-fantasma" data-cerrar>Cancelar</button><button type="submit" class="btn btn-peligro-lleno" id="e-ok">${I('basura')} Eliminar matriz</button></div>
  </form>`);
  const f = $('#f-eliminar');
  f.addEventListener('input', (e) => { e.target.closest('.campo')?.classList.remove('invalido'); $('#e-error').hidden = true; });
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = norm($('#e-codigo').value).toUpperCase(), nombre = norm($('#e-nombre').value), doc = norm($('#e-doc').value), just = norm($('#e-just').value), err = $('#e-error');
    $$('.campo', f).forEach((c) => c.classList.remove('invalido'));
    const faltan = [];
    if (codigo !== eq.equipo.toUpperCase()) { faltan.push(`el código ${eq.equipo} para confirmar`); $('#e-codigo').closest('.campo').classList.add('invalido'); }
    if (nombre.length < 3) { faltan.push('el nombre completo'); $('#e-nombre').closest('.campo').classList.add('invalido'); }
    if (doc.length < 4) { faltan.push('el documento de identificación'); $('#e-doc').closest('.campo').classList.add('invalido'); }
    if (just.length < 10) { faltan.push('la justificación (mínimo 10 caracteres)'); $('#e-just').closest('.campo').classList.add('invalido'); }
    if (faltan.length) { err.textContent = `Falta ${faltan.length > 1 ? `${faltan.slice(0, -1).join(', ')} y ${faltan.at(-1)}` : faltan[0]}.`; err.hidden = false; return; }
    const btn = $('#e-ok');
    btn.disabled = true; f.setAttribute('data-ocupado', '');
    $$('[data-cerrar]', f).forEach((x) => { x.disabled = true; });
    const prog = (t) => { $('#e-progreso').innerHTML = `<p class="progreso"><span class="giro" aria-hidden="true"></span>${esc(t)}</p>`; };
    try {
      const r = await eliminarEnGitHub(eq, { nombre, documento: doc, justificacion: just, accion: 'Eliminación', matriz: eq.equipo, aplicadoA: [], cambios }, prog);
      estado.editor = null;
      abrirCapa(`<div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="t-delok">
        <div class="d-icono ok">${I('check')}</div>
        <h2 id="t-delok">Matriz eliminada</h2>
        <p>La matriz del equipo ${esc(eq.equipo)} se eliminó y quedó registrada en el historial.${r.modeloVacio ? ` El modelo ${esc(eq.modelo)} ya no tiene equipos y no se mostrará en el inicio.` : ''} Los técnicos verán el cambio en 1 a 2 minutos.</p>
        <div class="d-acciones"><button type="button" class="btn btn-primario" id="del-inicio">Ir al inicio</button></div>
      </div>`, { alCerrar: () => ir({ vista: 'inicio' }) });
      $('#del-inicio').onclick = () => { cerrarCapa(false); ir({ vista: 'inicio' }); };
    } catch (x) {
      console.error(x);
      $('#e-progreso').innerHTML = '';
      err.textContent = x.message || 'No se pudo eliminar. Intente de nuevo.';
      err.hidden = false;
      btn.disabled = false; f.removeAttribute('data-ocupado');
      $$('[data-cerrar]', f).forEach((y) => { y.disabled = false; });
    }
  });
}

async function agregarAlHistorial(repo, registro) {
  const s = estado.sesion;
  const htxt = await repo.leerTexto('data/historial.json');
  let hist = { esquema: 1, cifrado: null };
  try { if (htxt) hist = JSON.parse(htxt); } catch { /* archivo vacío o dañado */ }
  let registros = [];
  if (hist.cifrado) {
    try { registros = JSON.parse(await descifrar(s.claveHistorial, hist.cifrado)); } catch {
      throw new Error('No se pudo abrir el historial con esta contraseña. Si la contraseña cambió, vuelva a configurar en configurar.html.');
    }
  }
  registros.push(registro);
  return { esquema: 1, registros: registros.length, cifrado: await cifrar(s.claveHistorial, JSON.stringify(registros)) };
}

async function eliminarEnGitHub(eq, registro, progreso) {
  const s = estado.sesion;
  if (!s || !s.token) throw new Error('El guardado en línea no está activado. Configure el token de GitHub en configurar.html (paso 4 de la guía).');
  const repo = new Repo({ ...datosRepo(estado.config), token: s.token });
  for (let intento = 0; ; intento++) {
    try {
      progreso('Leyendo la versión más reciente…');
      const txt = await repo.leerTexto('data/matrices.json');
      const remoto = txt ? JSON.parse(txt) : clonar(estado.datos);
      remoto.equipos = remoto.equipos || [];
      const i = remoto.equipos.findIndex((e) => e.id === eq.id);
      if (i < 0) throw new Error(`La matriz del equipo ${eq.equipo} ya no existe (otra persona pudo eliminarla).`);
      remoto.equipos.splice(i, 1);
      const modeloVacio = !!eq.modelo && !remoto.equipos.some((e) => (e.modelo || '') === eq.modelo);
      const ahora = ahoraISO();
      remoto.actualizado = ahora;

      progreso('Actualizando el historial de cambios…');
      const histNuevo = await agregarAlHistorial(repo, { fecha: ahora, ...registro, matriz: eq.equipo, matrizId: eq.id });

      progreso('Guardando en GitHub…');
      await repo.commit([
        { ruta: 'data/matrices.json', texto: `${JSON.stringify(remoto, null, 1)}\n` },
        { ruta: 'data/historial.json', texto: `${JSON.stringify(histNuevo, null, 2)}\n` },
      ], `Elimina matriz del equipo ${eq.equipo}${modeloVacio ? ` (modelo ${eq.modelo} sin equipos)` : ''}`);
      estado.datos = remoto;
      return { modeloVacio };
    } catch (e) {
      if (intento === 0 && (e.estado === 409 || e.estado === 422)) continue;
      throw e;
    }
  }
}

/* ---------------------------------------------------- Guardar en GitHub */
async function guardarEnGitHub(ed, registro, progreso) {
  const s = estado.sesion;
  if (!s || !s.token) throw new Error('El guardado en línea no está activado. Configure el token de GitHub en configurar.html (paso 4 de la guía).');
  const repo = new Repo({ ...datosRepo(estado.config), token: s.token });
  for (let intento = 0; ; intento++) {
    try {
      progreso('Leyendo la versión más reciente…');
      const txt = await repo.leerTexto('data/matrices.json');
      const remoto = txt ? JSON.parse(txt) : clonar(estado.datos);
      remoto.equipos = remoto.equipos || [];
      remoto.lubricantes = remoto.lubricantes || {};
      const ahora = ahoraISO();
      const eq = clonar(ed.borrador);
      ['equipo', 'descripcion', 'modelo', 'flota', 'activo', 'codigo', 'lugar', 'departamento'].forEach((k) => { eq[k] = norm(eq[k]); });
      eq.puntos = eq.puntos.map((p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, norm(v)])));
      eq.fichas = (eq.fichas || []).map((f) => ({ nombre: norm(f.nombre), url: norm(f.url) })).filter((f) => f.nombre || f.url);
      eq.actualizado = ahora;
      if (ed.modo === 'nuevo') {
        eq.equipo = eq.equipo.toUpperCase();
        if (remoto.equipos.some((e) => e.id.toUpperCase() === eq.equipo)) throw new Error(`El equipo ${eq.equipo} ya tiene matriz (otra persona pudo crearla). Edítela desde «Editar matriz».`);
        eq.id = eq.equipo;
        remoto.equipos.push(eq);
      } else {
        const i = remoto.equipos.findIndex((e) => e.id === eq.id);
        if (i >= 0) remoto.equipos[i] = eq; else remoto.equipos.push(eq);
      }
      lubsCambiados(ed).forEach((k) => { remoto.lubricantes[k] = { ...(remoto.lubricantes[k] || {}), ...ed.lubs[k] }; });
      lubricantesDe(eq, remoto.lubricantes).forEach((l) => {
        if (!remoto.lubricantes[l.clave]) remoto.lubricantes[l.clave] = { nombre: l.nombre, imagen: (ed.lubs[l.clave] || {}).imagen || '' };
      });
      // «Aplicar también a»: copia el contenido de la matriz a los equipos marcados
      const aplicados = [];
      (ed.aplicarA || new Set()).forEach((id) => {
        const o = remoto.equipos.find((x) => x.id === id);
        if (!o || o.id === eq.id) return;
        CONTENIDO.forEach((k) => { o[k] = clonar(eq[k] ?? ''); });
        o.actualizado = ahora;
        aplicados.push(o.equipo);
      });
      remoto.equipos.sort((a, b) => (a.modelo || '').localeCompare(b.modelo || '', 'es', { numeric: true }) || a.equipo.localeCompare(b.equipo, 'es', { numeric: true }));
      remoto.actualizado = ahora;

      progreso('Actualizando el historial de cambios…');
      const htxt = await repo.leerTexto('data/historial.json');
      let hist = { esquema: 1, cifrado: null };
      try { if (htxt) hist = JSON.parse(htxt); } catch { /* archivo vacío o dañado */ }
      let registros = [];
      if (hist.cifrado) {
        try { registros = JSON.parse(await descifrar(s.claveHistorial, hist.cifrado)); } catch {
          throw new Error('No se pudo abrir el historial con esta contraseña. Si la contraseña cambió, vuelva a configurar en configurar.html.');
        }
      }
      registros.push({ fecha: ahora, ...registro, matriz: eq.equipo, matrizId: eq.id, aplicadoA: aplicados });
      const histNuevo = { esquema: 1, registros: registros.length, cifrado: await cifrar(s.claveHistorial, JSON.stringify(registros)) };

      progreso('Guardando en GitHub…');
      const usadas = new Set([eq.imagen, eq.foto, ...Object.values(remoto.lubricantes).map((l) => l.imagen)]);
      const archivos = [
        { ruta: 'data/matrices.json', texto: `${JSON.stringify(remoto, null, 1)}\n` },
        { ruta: 'data/historial.json', texto: `${JSON.stringify(histNuevo, null, 2)}\n` },
        ...Object.entries(ed.pendientes).filter(([r]) => usadas.has(r)).map(([ruta, p]) => ({ ruta, base64: p.base64 })),
      ];
      await repo.commit(archivos, `${ed.modo === 'nuevo' ? 'Crea' : 'Actualiza'} matriz del equipo ${eq.equipo}${aplicados.length ? ` (+${aplicados.length} equipos)` : ''}`);
      estado.datos = remoto;
      return eq;
    } catch (e) {
      if (intento === 0 && (e.estado === 409 || e.estado === 422)) continue;
      throw e;
    }
  }
}

/* ------------------------------------------------------------ Historial */
async function vistaHistorial() {
  document.title = 'Historial de cambios';
  app.innerHTML = `${barraAdmin('Historial de cambios', { vista: 'inicio' }, '<button type="button" class="btn btn-sec btn-peq" data-accion="csv" disabled>' + I('descargar') + ' CSV</button>')}
  <section class="contenedor vista-admin">
    <h1>Historial de cambios</h1>
    <p class="lead">Quién actualizó, creó o eliminó cada matriz, cuándo y qué cambió. Este registro se guarda cifrado.</p>
    <div id="h-lista" style="margin-top:18px"><p class="progreso"><span class="giro" aria-hidden="true"></span>Cargando historial…</p></div>
  </section>`;
  let regs = [];
  try {
    let txt;
    if (estado.sesion.token) txt = await new Repo({ ...datosRepo(estado.config), token: estado.sesion.token }).leerTexto('data/historial.json');
    else txt = await (await fetch('data/historial.json', { cache: 'no-store' })).text();
    const h = txt ? JSON.parse(txt) : {};
    if (h.cifrado) regs = JSON.parse(await descifrar(estado.sesion.claveHistorial, h.cifrado));
  } catch (e) {
    console.error(e);
    $('#h-lista').innerHTML = `<div class="errores">No se pudo cargar el historial. ${esc(e.message || '')}</div>`;
    return;
  }
  estado.historial = regs;
  regs = [...regs].reverse();
  const csv = $('[data-accion="csv"]');
  if (csv) csv.disabled = !regs.length;
  $('#h-lista').innerHTML = regs.length ? `<ul class="historial">${regs.map((r) => `<li class="h-item">
      <div class="h-cab"><span class="etiqueta ${r.accion === 'Creación' ? 'nueva' : r.accion === 'Eliminación' ? 'eliminada' : ''}">${esc(r.accion)}</span><b>${esc(r.matriz)}</b><span class="h-fecha">${esc(fechaHora(r.fecha))}</span></div>
      <p class="h-persona">${esc(r.nombre)} · Doc. ${esc(r.documento)}${(r.aplicadoA || []).length ? ` · también a ${esc(r.aplicadoA.join(', '))}` : ''}</p>
      ${r.justificacion ? `<p class="h-just"><b>Justificación:</b> ${esc(r.justificacion)}</p>` : ''}
      <details><summary>${(r.cambios || []).length} cambio${(r.cambios || []).length === 1 ? '' : 's'} realizado${(r.cambios || []).length === 1 ? '' : 's'}</summary>
      <ul class="cambios">${(r.cambios || []).map((c) => `<li>${esc(c)}</li>`).join('')}</ul></details>
    </li>`).join('')}</ul>`
    : '<div class="sin-resultados">Todavía no hay cambios registrados.</div>';
}

function descargarCSV() {
  const regs = estado.historial || [];
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = [['Fecha', 'Acción', 'Equipo', 'Aplicado también a', 'Nombre', 'Documento', 'Justificación', 'Cambios realizados']]
    .concat(regs.map((r) => [fechaHora(r.fecha), r.accion, r.matriz, (r.aplicadoA || []).join(', '), r.nombre, r.documento, r.justificacion || '', (r.cambios || []).join(' | ')]));
  const blob = new Blob(['﻿' + filas.map((f) => f.map(q).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  descargarBlob(blob, `Historial_matrices_${hoyISO()}.csv`);
}

/* ------------------------------------------------------- Eventos globales */
document.addEventListener('click', async (e) => {
  const a = e.target.closest('a[data-nav], a[data-ir], a[data-editar], a[data-volver], a[data-unidad-ir]');
  if (a && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
    e.preventDefault();
    if (a.dataset.nav === 'inicio') return ir({ vista: 'inicio' });
    if (a.dataset.ir) return ir({ vista: 'matriz', id: a.dataset.ir });
    if (a.dataset.unidadIr) return ir({ vista: 'unidad', codigo: a.dataset.unidadIr });
    if (a.dataset.editar) return ir({ vista: 'editar', id: a.dataset.editar });
    if (a.dataset.volver) return ir(JSON.parse(a.dataset.volver));
  }
  const b = e.target.closest('[data-accion]');
  if (!b || b.disabled) return;
  const acc = b.dataset.accion;
  const ed = estado.editor;
  switch (acc) {
    case 'editar': case 'nueva': case 'historial':
      if (!navigator.onLine) { toast('Sin conexión: editar, crear o ver el historial requiere internet.', 'error'); return; }
      return ir({ vista: acc === 'editar' ? 'editar' : acc });
    case 'precargar':
      if (!pedirPrecarga()) toast('Necesita conexión a internet para guardar la copia.', 'error');
      else { const est = $('#offline-estado'); if (est) est.textContent = 'Preparando la descarga…'; }
      return;
    case 'instalar':
      if (estado.instalar) { estado.instalar.prompt(); estado.instalar.userChoice.finally(() => { estado.instalar = null; b.hidden = true; }); }
      return;
    case 'salir': {
      if (ed && calcularCambios(ed).length && !(await confirmar({ titulo: '¿Cerrar la sesión?', texto: 'Hay cambios sin guardar que se perderán.', si: 'Cerrar sesión', no: 'Seguir editando' }))) return;
      return cerrarSesion();
    }
    case 'csv': return descargarCSV();
    case 'descargar': {
      const eq = estado.datos.equipos.find((x) => x.id === rutaActual.id);
      if (eq) hojaDescarga(eq);
      return;
    }
    case 'qr-inicio': {
      b.disabled = true;
      try {
        const blob = await etiquetaQR({ titulo: 'Matrices de lubricación', eyebrow: 'Página de inicio', detalle: 'Buscador de equipos', url: urlBase(), pie: `${plantilla().departamento || 'Departamento de Tribología'} · ${lugarGeneral()}`, logoBlanco: LOGO_BLANCO });
        descargarBlob(blob, 'QR_Inicio_Matrices_de_lubricacion.png');
        toast('Imagen descargada');
      } catch (x) { console.error(x); toast('No se pudo generar el QR', 'error'); }
      b.disabled = false;
      return;
    }
    case 'ampliar': return visor(b.dataset.src);
    case 'qr-modelo': {
      const eqs = agrupar(listaFiltrada(estado.q, true).lista).find((g) => g.modelo === b.dataset.modelo)?.eqs || delModelo(b.dataset.modelo);
      b.disabled = true; const txt = b.innerHTML;
      try { await zipQR(eqs, `equipos_${b.dataset.modelo}`, (i, n) => { b.textContent = `Generando ${i} de ${n}…`; }); toast('ZIP descargado'); }
      catch (x) { console.error(x); toast('No se pudo generar el ZIP', 'error'); }
      b.innerHTML = txt; b.disabled = false;
      return;
    }
    case 'eliminar-matriz': return ed && ed.modo === 'editar' ? dialogoEliminar() : undefined;
    case 'cancelar-edicion': return ir(ed && ed.modo === 'editar' ? { vista: 'editar' } : { vista: 'inicio' });
    case 'agregar-punto': {
      ed.borrador.puntos.push(puntoVacio());
      pintarPuntosEditor();
      const ult = $(`[data-i="${ed.borrador.puntos.length - 1}"]`);
      ult.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => ult.querySelector('input').focus({ preventScroll: true }), 300);
      return;
    }
    case 'subir-punto': case 'bajar-punto': {
      const i = +b.closest('[data-i]').dataset.i, j = acc === 'subir-punto' ? i - 1 : i + 1;
      const pts = ed.borrador.puntos;
      [pts[i], pts[j]] = [pts[j], pts[i]];
      pintarPuntosEditor(); pintarLubsEditor();
      $(`[data-i="${j}"] [data-accion="${acc}"]`)?.focus();
      return;
    }
    case 'borrar-punto': {
      const i = +b.closest('[data-i]').dataset.i;
      const p = ed.borrador.puntos[i];
      if (!(await confirmar({ titulo: `¿Eliminar el punto ${i + 1}?`, texto: `${p.componente || 'Este punto'} se quitará de la matriz al guardar.`, si: 'Eliminar punto', no: 'Cancelar' }))) return;
      ed.borrador.puntos.splice(i, 1);
      pintarPuntosEditor(); pintarLubsEditor();
      return;
    }
    case 'agregar-ficha': ed.borrador.fichas.push({ nombre: '', url: '' }); pintarFichasEditor(); $(`[data-f="${ed.borrador.fichas.length - 1}"] input`).focus(); return;
    case 'borrar-ficha': ed.borrador.fichas.splice(+b.closest('[data-f]').dataset.f, 1); pintarFichasEditor(); return;
    case 'quitar-foto': ed.borrador.foto = ''; pintarFotoEditor(); return;
    case 'quitar-img': ed.borrador.imagen = ''; pintarImagenEditor(); return;
    case 'quitar-img-lub': {
      const k = b.dataset.clave;
      ed.lubs[k] = { ...(ed.lubs[k] || {}), imagen: '' };
      pintarLubsEditor();
      return;
    }
    default:
  }
});

document.addEventListener('click', (e) => {
  if (e.target.closest('#filtros')) return;
  $$('#filtros .filtro-panel:not([hidden])').forEach((p) => { p.hidden = true; p.closest('.filtro').querySelector('.filtro-btn').setAttribute('aria-expanded', 'false'); });
  document.body.classList.remove('filtro-abierto');
});

window.addEventListener('beforeunload', (e) => {
  if (estado.editor && estado.editor.borrador && calcularCambios(estado.editor).length) { e.preventDefault(); e.returnValue = ''; }
});

/* ------------------------------------------------------------------ Inicio */
async function cargarJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  if (r.headers.get('X-Desde-Cache') === '1') estado.desdeCopia = true;
  return r.json();
}

/* ------------------------------------------------- Uso sin conexión */
const LS = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* almacenamiento no disponible */ } },
};
estado.instalar = null;

function pintarAvisoRed() {
  let b = $('#aviso-red');
  const sinRed = !navigator.onLine || estado.desdeCopia;
  if (!sinRed) { if (b) b.remove(); return; }
  if (!b) {
    b = document.createElement('div');
    b.id = 'aviso-red'; b.className = 'aviso-red'; b.setAttribute('role', 'status');
    $('.banda').after(b);
  }
  const p = LS.get('precarga');
  b.innerHTML = `<div class="contenedor">${I('info', 'i-peq')}<span><b>Sin conexión.</b> Está viendo la copia guardada en este celular${p && p.fecha ? ` (actualizada el ${esc(fechaHora(p.fecha))})` : ''}. Editar requiere internet.</span></div>`;
}

function textoOffline() {
  const p = LS.get('precarga');
  if (!('serviceWorker' in navigator)) return 'Este navegador no permite el uso sin conexión.';
  if (p && p.fecha) return `${I('check', 'i-peq')} Disponible sin conexión en este celular: ${p.equipos || ''} matrices con sus imágenes. Última actualización: ${esc(fechaHora(p.fecha))}`;
  return 'Guarde las matrices en este celular para consultarlas aunque no haya señal (unos 8 MB).';
}

function htmlOffline() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="offline-card" id="offline-card">
    <div class="d-icono">${I('descargar')}</div>
    <div>
      <h2>Uso sin conexión</h2>
      <p id="offline-estado">${textoOffline()}</p>
      <div class="barra-progreso" id="offline-barra" hidden><span></span></div>
      <div class="fila-botones" style="margin:10px 0 0">
        <button type="button" class="btn btn-sec btn-peq" data-accion="precargar">${I('descargar', 'i-peq')} ${LS.get('precarga') ? 'Actualizar copia' : 'Guardar para uso sin conexión'}</button>
        <button type="button" class="btn btn-primario btn-peq" data-accion="instalar" ${estado.instalar ? '' : 'hidden'}>${I('mas', 'i-peq')} Instalar en el celular</button>
      </div>
      ${ios ? '<p class="ayuda" style="margin:10px 0 0">En iPhone: toque Compartir y luego «Agregar a pantalla de inicio» para abrirla como una app.</p>' : ''}
    </div>
  </div>`;
}

function pedirPrecarga() {
  if (!('serviceWorker' in navigator) || !navigator.onLine) return false;
  navigator.serviceWorker.ready.then((reg) => reg.active && reg.active.postMessage({ tipo: 'precargar' }));
  return true;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (e) => {
    const m = e.data || {};
    const est = $('#offline-estado'), barra = $('#offline-barra');
    if (m.tipo === 'progreso') {
      if (est) est.textContent = `Guardando matrices e imágenes en este celular… ${m.hechos} de ${m.total}`;
      if (barra) { barra.hidden = false; barra.firstElementChild.style.width = `${m.total ? Math.round((m.hechos / m.total) * 100) : 0}%`; }
    } else if (m.tipo === 'listo') {
      LS.set('precarga', { fecha: m.fecha, equipos: m.equipos, actualizado: m.actualizado });
      if (est) est.innerHTML = textoOffline();
      if (barra) barra.hidden = true;
      pintarAvisoRed();
    } else if (m.tipo === 'error') {
      if (est) est.textContent = 'No se pudo completar la copia. Se intentará de nuevo cuando haya buena señal.';
      if (barra) barra.hidden = true;
    }
  });
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  estado.instalar = e;
  const b = $('[data-accion="instalar"]'); if (b) b.hidden = false;
});
window.addEventListener('online', () => { estado.desdeCopia = false; pintarAvisoRed(); });
window.addEventListener('offline', pintarAvisoRed);

async function iniciar() {
  try {
    const [config, datos] = await Promise.all([cargarJSON('data/config.json'), cargarJSON('data/matrices.json')]);
    estado.config = config;
    estado.datos = datos;
    datos.equipos = datos.equipos || [];
  } catch (e) {
    console.error(e);
    app.innerHTML = `<div class="estado-vacio contenedor"><div class="d-icono">${I('alerta')}</div><h1>No se pudieron cargar las matrices</h1>
      <p>Revise la conexión a internet e intente de nuevo.</p><button type="button" class="btn btn-primario" onclick="location.reload()">Reintentar</button></div>`;
    return;
  }
  const r = leerRuta();
  history.replaceState(r, '', location.pathname + location.search);
  render(r);
  pintarAvisoRed();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').then(() => {
      // Copia automática la primera vez o cuando las matrices cambiaron
      const p = LS.get('precarga');
      if (!estado.desdeCopia && (!p || p.actualizado !== (estado.datos.actualizado || ''))) pedirPrecarga();
    }).catch(() => {});
  }
}
iniciar();
