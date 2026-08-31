(function () {
  // ---- Tabs ----
  const tabBtns = document.querySelectorAll('.tab-btn');
  const views = document.querySelectorAll('.view');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
      btn.scrollIntoView({ inline: 'center', block: 'nearest' });
    });
  });

  // ---- Generic chip multi-select ----
  function wireChips(containerId) {
    document.querySelectorAll('#' + containerId + ' .chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('selected'));
    });
  }
  ['escenarioChips', 'monitoreoChips', 'sintomasChips', 'gradoChips', 'bioensayoChips'].forEach(wireChips);

  function chipValues(containerId) {
    return Array.from(document.querySelectorAll('#' + containerId + ' .chip.selected')).map(c => c.dataset.val);
  }

  // sintomas alert
  document.querySelectorAll('#sintomasChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const vals = chipValues('sintomasChips');
      const alerta = document.getElementById('sintomasAlerta');
      if (vals.length > 0) {
        alerta.style.display = 'block';
        alerta.textContent = 'Con ' + vals.join(', ').toLowerCase() + ': indicación de traslado a hospital independientemente del tiempo de vómito.';
      } else { alerta.style.display = 'none'; }
    });
  });

  // ---- Generic 2-way toggle ----
  function wireToggle2(id, danger) {
    const box = document.getElementById(id);
    box.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        box.querySelectorAll('button').forEach(b => b.classList.remove('selected', 'danger'));
        btn.classList.add('selected');
        if (danger && /no/i.test(btn.dataset.val) === false && box.id === 'escenaToggle' && btn.dataset.val === 'No') { btn.classList.add('danger'); }
      });
    });
  }
  ['blindajeToggle', 'escenaToggle', 'riesgoVidaToggle', 'vomitosToggle', 'descontamToggle', 'irrigadasToggle', 'resultadoToggle', 'kiToggle'].forEach(id => wireToggle2(id));
  // fallecidoToggle handled separately below (affects CRAMP category)

  function toggleValue(id) {
    const sel = document.querySelector('#' + id + ' button.selected');
    return sel ? sel.dataset.val : '';
  }

  // ---- Score param selector (radio-like within a .param) ----
  function wireParams(rootId, onChange) {
    const root = document.getElementById(rootId);
    root.querySelectorAll('.param').forEach(param => {
      param.querySelectorAll('.opt').forEach(opt => {
        opt.addEventListener('click', () => {
          param.querySelectorAll('.opt').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          onChange();
        });
      });
    });
  }
  function getSelected(rootId) {
    const root = document.getElementById(rootId);
    const groups = root.querySelectorAll('.param');
    const values = {}; let allSelected = true;
    groups.forEach(g => {
      const sel = g.querySelector('.opt.selected');
      if (sel) { values[g.dataset.group] = parseInt(sel.dataset.val, 10); } else { allSelected = false; }
    });
    return { values, allSelected };
  }

  // ---- CRAMP ----
  let fallecido = false;
  document.getElementById('fallecidoToggle').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('fallecidoToggle').querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      fallecido = btn.dataset.val === 'si';
      updateCramp();
    });
  });

  function updateCramp() {
    const { values, allSelected } = getSelected('view-cramp');
    const total = Object.values(values).reduce((a, b) => a + b, 0);
    const totalEl = document.getElementById('cramp_total');
    const badge = document.getElementById('cramp_badge');
    if (fallecido) {
      totalEl.textContent = '—';
      badge.textContent = 'Blanco — Fallecido (última prioridad)';
      badge.className = 'badge blanco';
      return;
    }
    if (Object.keys(values).length === 0) { totalEl.textContent = '—'; badge.textContent = 'Incompleto'; badge.className = 'badge neutral'; return; }
    totalEl.textContent = total + (allSelected ? '/10' : '/10*');
    if (!allSelected) { badge.textContent = 'Faltan ítems'; badge.className = 'badge neutral'; return; }
    if (total >= 9) { badge.textContent = 'Verde — leves (4.ª prioridad)'; badge.className = 'badge ok'; }
    else if (total >= 7) { badge.textContent = 'Amarillo — moderados (2.ª prioridad)'; badge.className = 'badge mid'; }
    else if (total >= 2) { badge.textContent = 'Rojo — críticos recuperables (1.ª prioridad)'; badge.className = 'badge warn'; }
    else { badge.textContent = 'Negro — críticos no recuperables (3.ª prioridad)'; badge.className = 'badge negro'; }
  }
  wireParams('view-cramp', updateCramp);

  // ---- Glasgow ----
  function updateGlasgow() {
    const { values, allSelected } = getSelected('view-glasgow');
    const total = Object.values(values).reduce((a, b) => a + b, 0);
    const totalEl = document.getElementById('glasgow_total');
    const badge = document.getElementById('glasgow_badge');
    if (Object.keys(values).length === 0) { totalEl.textContent = '—'; badge.textContent = 'Incompleto'; badge.className = 'badge neutral'; return; }
    totalEl.textContent = total + (allSelected ? '/15' : '/15*');
    if (!allSelected) { badge.textContent = 'Faltan ítems'; badge.className = 'badge neutral'; return; }
    if (total <= 8) { badge.textContent = 'Compromiso de conciencia severo'; badge.className = 'badge warn'; }
    else if (total <= 12) { badge.textContent = 'Compromiso moderado'; badge.className = 'badge mid'; }
    else { badge.textContent = 'Sin compromiso severo'; badge.className = 'badge ok'; }
  }
  wireParams('view-glasgow', updateGlasgow);

  // ---- Dosis por síntomas (single-select) ----
  let dosisSel = null;
  document.querySelectorAll('#dosisOptions .opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('#dosisOptions .opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      dosisSel = { presentacion: opt.childNodes[0].textContent.trim(), dosis: opt.dataset.dosis, conducta: opt.dataset.conducta };
      const badge = document.getElementById('conductaBadge');
      badge.textContent = opt.dataset.conducta;
      badge.className = 'badge mid';
    });
  });

  // ---- Destino (single-select) ----
  document.querySelectorAll('#destinoOptions .opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('#destinoOptions .opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  // ---- Hora actual ----
  document.getElementById('btnAhora').addEventListener('click', () => {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('f_hAtencion').value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (!document.getElementById('f_fecha').value) {
      document.getElementById('f_fecha').value = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    }
  });

  // ---- Resumen ----
  function generarResumen() {
    const v = id => document.getElementById(id).value.trim();
    let out = '';
    out += `EMERGENCIA RADIOLÓGICA / NUCLEAR — FICHA DE ATENCIÓN\n`;
    out += `Guardia CNEA Ezeiza\n\n`;
    out += `PACIENTE: ${v('f_nombre')}   DNI: ${v('f_dni')}\n`;
    out += `Edad: ${v('f_edad')}  Sexo: ${v('f_sexo')}  N.º H.C.: ${v('f_hc')}\n`;
    out += `Fecha del incidente: ${v('f_fecha')}   Lugar: ${v('f_lugar')}\n`;
    out += `Médico interviniente: ${v('f_medico')}\n\n`;

    out += `CRONOLOGÍA\n`;
    out += `  Incidente: ${v('f_hIncidente')}  Llamado: ${v('f_hLlamado')}  Acceso: ${v('f_hAcceso')}  Inicio atención: ${v('f_hAtencion')}\n\n`;

    out += `DESCRIPCIÓN DEL INCIDENTE\n${v('f_quePaso') || '-'}\n`;
    const escenario = chipValues('escenarioChips');
    if (escenario.length) out += `Escenario: ${escenario.join(', ')}\n`;
    out += `Fuente/radionucleido: ${v('f_fuente')}   Actividad: ${v('f_actividad')}\n`;
    out += `Distancia: ${v('f_distancia')}   Tiempo de exposición: ${v('f_tExposicion')}   Blindaje: ${toggleValue('blindajeToggle')}\n`;
    if (v('f_circunstancias')) out += `Circunstancias/vía de incorporación: ${v('f_circunstancias')}\n`;

    out += `\nESCENA Y ABCDE\n`;
    out += `Escena segura: ${toggleValue('escenaToggle')}`;
    if (v('f_riesgoEscena')) out += `  — riesgo: ${v('f_riesgoEscena')}`;
    out += `\n`;
    out += `A: ${v('f_a') || '-'}\nB: ${v('f_b') || '-'}\nC: ${v('f_c') || '-'}\nD: ${v('f_d') || '-'}\nE: ${v('f_e') || '-'}\n`;
    out += `Riesgo de vida: ${toggleValue('riesgoVidaToggle')}\n`;

    const crampTotalTxt = document.getElementById('cramp_total').textContent;
    out += `\nCRAMP: ${crampTotalTxt}  (${document.getElementById('cramp_badge').textContent})\n`;

    const gTotalTxt = document.getElementById('glasgow_total').textContent;
    if (gTotalTxt !== '—') {
      out += `\nGLASGOW: ${gTotalTxt}  (${document.getElementById('glasgow_badge').textContent})\n`;
    }

    out += `\nMONITOREO RADIOLÓGICO\n`;
    out += `OPR: ${v('f_opr')}  Hora: ${v('f_hOpr')}\n`;
    const monitoreo = chipValues('monitoreoChips');
    if (monitoreo.length) out += `Resultado: ${monitoreo.join(', ')}\n`;
    if (v('f_ubicacionAfectada')) out += `Ubicación/superficie afectada: ${v('f_ubicacionAfectada')}\n`;
    if (v('f_tipoRadiacion')) out += `Tipo de radiación: ${v('f_tipoRadiacion')}\n`;

    out += `\nSÍNTOMAS Y DOSIS\n`;
    out += `Vómitos: ${toggleValue('vomitosToggle')}`;
    if (v('f_hVomito')) out += `  hora: ${v('f_hVomito')}`;
    out += `\n`;
    const sintomas = chipValues('sintomasChips');
    if (sintomas.length) out += `Otros síntomas: ${sintomas.join(', ')}\n`;
    if (dosisSel) out += `Presentación: ${dosisSel.presentacion} → Dosis est. ${dosisSel.dosis} → ${dosisSel.conducta}\n`;
    if (v('f_indiceT')) out += `Índice N/L+vómitos: T=${v('f_indiceT')}\n`;
    if (v('f_hemograma')) out += `Hemograma seriado: ${v('f_hemograma')}\n`;

    if (v('f_areaLesion') || v('f_hEritema') || v('f_dosisLocal') || chipValues('gradoChips').length || v('f_quemConcurrente')) {
      out += `\nLESIÓN CUTÁNEA POR RADIACIÓN\n`;
      if (v('f_areaLesion')) out += `Localización/área: ${v('f_areaLesion')}\n`;
      if (v('f_hEritema')) out += `Hora eritema inicial: ${v('f_hEritema')}\n`;
      if (v('f_dosisLocal')) out += `Dosis local estimada: ${v('f_dosisLocal')}\n`;
      const grado = chipValues('gradoChips');
      if (grado.length) out += `Grado: ${grado.join(', ')}\n`;
      if (v('f_quemConcurrente')) out += `Quemadura térmica concurrente: ${v('f_quemConcurrente')}\n`;
    }

    out += `\nDESCONTAMINACIÓN\n`;
    out += `Realizada: ${toggleValue('descontamToggle')}  Ciclos: ${v('f_ciclos')}  Heridas irrigadas: ${toggleValue('irrigadasToggle')}\n`;
    out += `Resultado final aceptable: ${toggleValue('resultadoToggle')}`;
    if (v('f_persisteActividad')) out += `  — persiste en: ${v('f_persisteActividad')}`;
    out += `\n`;
    const bioensayo = chipValues('bioensayoChips');
    if (bioensayo.length) out += `Bioensayo: ${bioensayo.join(', ')}\n`;
    if (v('f_incorporacion')) out += `Sospecha contaminación interna / vía: ${v('f_incorporacion')}\n`;

    out += `\nTRATAMIENTO\n${v('f_tratamiento') || '-'}\n`;
    out += `Yoduro de potasio: ${toggleValue('kiToggle')}`;
    if (v('f_kiIndicacion')) out += `  — indicación: ${v('f_kiIndicacion')}`;
    out += `\n`;

    out += `\nNOTIFICACIÓN\n`;
    out += `OPR: ${v('f_notifOpr')} (${v('f_notifOprH')})\n`;
    out += `Coordinación médica: ${v('f_notifCoord')} (${v('f_notifCoordH')})\n`;
    out += `ARN: ${v('f_notifArn')} (${v('f_notifArnH')})\n`;
    if (v('f_notifReacts')) out += `REAC/TS: ${v('f_notifReacts')} (${v('f_notifReactsH')})\n`;

    const destinoSel = document.querySelector('#destinoOptions .opt.selected');
    out += `\nDESTINO\n${destinoSel ? destinoSel.dataset.val : '-'}\n`;
    if (v('f_centroReceptor')) out += `Centro receptor: ${v('f_centroReceptor')}\n`;
    if (v('f_observaciones')) out += `Observaciones: ${v('f_observaciones')}\n`;

    document.getElementById('resumenBox').value = out;
  }
  document.getElementById('btnGenerar').addEventListener('click', generarResumen);

  document.getElementById('btnCopiar').addEventListener('click', async () => {
    const box = document.getElementById('resumenBox');
    const msg = document.getElementById('copyMsg');
    if (!box.value) { generarResumen(); }
    try {
      box.select(); box.setSelectionRange(0, 999999);
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(box.value); }
      else { document.execCommand('copy'); }
      msg.textContent = 'Copiado ✓';
      setTimeout(() => { msg.textContent = ''; }, 2000);
    } catch (e) { msg.textContent = 'No se pudo copiar automáticamente, seleccioná y copiá el texto manualmente.'; }
  });

  document.getElementById('btnCompartir').addEventListener('click', async () => {
    const box = document.getElementById('resumenBox');
    if (!box.value) { generarResumen(); }
    if (navigator.share) { try { await navigator.share({ text: box.value }); } catch (e) { } }
    else { document.getElementById('copyMsg').textContent = 'Compartir no disponible en este navegador; usá "Copiar".'; }
  });

  document.getElementById('btnLimpiar').addEventListener('click', () => {
    if (!confirm('¿Borrar todos los campos y scores?')) return;
    document.querySelectorAll('input[type=text], textarea').forEach(el => {
      if (el.id === 'f_medico') return; // keep default
      el.value = '';
    });
    document.querySelectorAll('.opt.selected, .chip.selected').forEach(o => o.classList.remove('selected'));
    document.querySelectorAll('.toggle2 button.selected').forEach(b => b.classList.remove('selected', 'danger'));
    fallecido = false;
    dosisSel = null;
    document.getElementById('conductaBadge').textContent = '—';
    document.getElementById('conductaBadge').className = 'badge neutral';
    document.getElementById('sintomasAlerta').style.display = 'none';
    updateGlasgow(); updateCramp();
    document.getElementById('resumenBox').value = '';
    tabBtns.forEach(b => b.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));
    document.querySelector('.tab-btn[data-view="ficha"]').classList.add('active');
    document.getElementById('view-ficha').classList.add('active');
  });
})();
