/* ═══════════════════════════════════════════════
   INOVOXA — interações e motion design
   ═══════════════════════════════════════════════ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── NAV ── */
  const nav = document.getElementById('nav');
  const navUl = document.getElementById('nav-ul');
  const hbg = document.getElementById('hbg');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  hbg.addEventListener('click', () => {
    const open = navUl.classList.toggle('open');
    hbg.classList.toggle('open', open);
    hbg.setAttribute('aria-expanded', open);
  });
  navUl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navUl.classList.remove('open');
    hbg.classList.remove('open');
    hbg.setAttribute('aria-expanded', 'false');
  }));

  /* ══════════════════════════════════════════════
     HEIGHTFIELD — malha de terreno em perspectiva
     Ondas orgânicas geradas por soma de senoides
     ══════════════════════════════════════════════ */
  const canvas = document.getElementById('heightfield');
  const ctx = canvas.getContext('2d');
  let W, H, DPR, t = 0, hfVisible = true, raf = null;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // altura orgânica: soma de senoides defasadas (heightfield procedural)
  function heightAt(x, z, time) {
    return (
      Math.sin(x * 0.9 + time * 0.7) * 0.55 +
      Math.sin(z * 0.7 - time * 0.45) * 0.75 +
      Math.sin((x + z) * 0.45 + time * 0.32) * 0.9 +
      Math.sin(Math.sqrt(x * x + z * z) * 0.6 - time * 0.6) * 0.45
    );
  }

  function drawHeightfield() {
    ctx.clearRect(0, 0, W, H);
    const cols = 64, rows = 26;
    const horizonY = H * 0.42;         // linha do horizonte
    const camY = 3.2;                  // altura da câmera
    const fov = H * 0.9;
    const scrollFade = Math.max(0, 1 - window.scrollY / (innerHeight * 1.15));
    if (scrollFade <= 0.01) return;

    for (let zi = rows; zi >= 1; zi--) {
      const z = zi * 0.85 + 1.5;
      const zNext = (zi + 1) * 0.85 + 1.5;
      const depth = zi / rows;
      ctx.beginPath();
      for (let xi = 0; xi <= cols; xi++) {
        const x = (xi / cols - 0.5) * 34;
        const y = heightAt(x * 0.4, z, t) * (0.6 + depth * 1.3);
        const sx = W / 2 + (x / z) * fov * 0.55;
        const sy = horizonY + ((camY - y) / z) * fov * 0.5;
        xi === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      const alpha = (0.02 + (1 - depth) * 0.16) * scrollFade;
      const hue = 168 + depth * 55; // teal → azul conforme afasta
      ctx.strokeStyle = `hsla(${hue}, 85%, ${52 - depth * 14}%, ${alpha})`;
      ctx.lineWidth = DPR * (1.1 - depth * 0.55);
      ctx.stroke();

      // linhas verticais esparsas para dar leitura de malha
      if (zi % 2 === 0) {
        for (let xi = 0; xi <= cols; xi += 4) {
          const x = (xi / cols - 0.5) * 34;
          const y1 = heightAt(x * 0.4, z, t) * (0.6 + depth * 1.3);
          const y2 = heightAt(x * 0.4, zNext, t) * (0.6 + (zi + 1) / rows * 1.3);
          const sx1 = W / 2 + (x / z) * fov * 0.55;
          const sy1 = horizonY + ((camY - y1) / z) * fov * 0.5;
          const sx2 = W / 2 + (x / zNext) * fov * 0.55;
          const sy2 = horizonY + ((camY - y2) / zNext) * fov * 0.5;
          ctx.beginPath();
          ctx.moveTo(sx1, sy1);
          ctx.lineTo(sx2, sy2);
          ctx.strokeStyle = `hsla(${hue}, 85%, 48%, ${alpha * 0.45})`;
          ctx.lineWidth = DPR * 0.6;
          ctx.stroke();
        }
      }
    }

    // brilho suave no horizonte
    const g = ctx.createRadialGradient(W / 2, horizonY, 0, W / 2, horizonY, W * 0.45);
    g.addColorStop(0, `rgba(0, 229, 195, ${0.05 * scrollFade})`);
    g.addColorStop(1, 'rgba(0,229,195,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function loop() {
    t += 0.012;
    drawHeightfield();
    raf = requestAnimationFrame(loop);
  }

  if (!reduceMotion) {
    loop();
    // pausa quando a aba não está visível
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) loop();
    });
  } else {
    drawHeightfield(); // frame estático
  }

  /* ── REVEAL ON SCROLL ── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('v');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv, .agent').forEach(el => obs.observe(el));

  /* ── CONTADORES ── */
  const cntObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cntObs.unobserve(e.target);
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      const start = performance.now();
      (function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      })(start);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => cntObs.observe(el));

  /* ── TICKER DO HERO ── */
  const tickerEl = document.getElementById('hero-ticker');
  const tickerMsgs = [
    'Agente de atendimento respondeu um lead há 9s',
    'Agente SDR qualificou um lead · score 92',
    'Proposta #148 gerada e enviada por WhatsApp',
    'Follow-up reativou uma conversa parada há 3 dias',
    'Reunião agendada automaticamente para amanhã, 10h',
    'CRM atualizado: 14 oportunidades movidas hoje'
  ];
  let tickerIdx = 0;
  if (!reduceMotion) {
    setInterval(() => {
      tickerIdx = (tickerIdx + 1) % tickerMsgs.length;
      tickerEl.style.opacity = 0;
      setTimeout(() => {
        tickerEl.textContent = tickerMsgs[tickerIdx];
        tickerEl.style.transition = 'opacity .4s';
        tickerEl.style.opacity = 1;
      }, 400);
    }, 4200);
  }

  /* ── CHIPS DE AGENTES (aparição escalonada) ── */
  const chips = document.querySelectorAll('.agent-chip');
  const sceneObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      sceneObs.unobserve(e.target);
      chips.forEach((c, i) => setTimeout(() => c.classList.add('on'), 600 + i * 450));
    });
  }, { threshold: 0.4 });
  const scene = document.getElementById('hero-scene');
  if (scene) sceneObs.observe(scene);

  /* ── VÍDEO DO HERO (fallback se não carregar) ── */
  const heroVideo = document.getElementById('hero-video');
  if (heroVideo) {
    const media = heroVideo.parentElement;
    heroVideo.addEventListener('error', () => media.classList.add('no-video'), true);
    const src = heroVideo.querySelector('source');
    if (src) src.addEventListener('error', () => media.classList.add('no-video'));
    // se em 4s não tiver dados, mostra o fallback (mantém o vídeo tentando)
    setTimeout(() => { if (heroVideo.readyState < 2) media.classList.add('no-video'); }, 4000);
    heroVideo.addEventListener('canplay', () => media.classList.remove('no-video'));
  }

  /* ── TILT SUAVE DA CENA (segue o mouse) ── */
  if (scene && !reduceMotion && matchMedia('(pointer:fine)').matches) {
    const frame = scene.querySelector('.scene-frame');
    scene.addEventListener('mousemove', e => {
      const r = scene.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      frame.style.transform = `rotateY(${-6 + px * 5}deg) rotateX(${2 - py * 4}deg)`;
    });
    scene.addEventListener('mouseleave', () => { frame.style.transform = ''; });
  }

  /* ── SPOTLIGHT nos cards de agente ── */
  document.querySelectorAll('.agent').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ══════════════════════════════════════════════
     WHATSAPP — conversa realista animada em loop
     ══════════════════════════════════════════════ */
  const chat = document.getElementById('wa-chat');
  const waStatus = document.getElementById('wa-status');
  const phoneBadge = document.getElementById('phone-badge');

  const docIcon = '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" fill="#e05252"/><path d="M8 7h8M8 11h8M8 15h5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';

  const script = [
    { from: 'in',  wait: 900,  time: '23:47', text: 'Oi, vocês ainda estão atendendo? Queria um orçamento pra automatizar o atendimento da minha loja' },
    { from: 'out', wait: 1600, time: '23:47', typing: 1100, text: 'Olá! 👋 Claro — por aqui o atendimento nunca fecha. Sou a assistente da Inovoxa e já posso montar seu orçamento. Me conta: quantos atendimentos vocês recebem por dia no WhatsApp?' },
    { from: 'in',  wait: 2300, time: '23:48', text: 'Uns 80 por dia, mas a equipe só consegue responder metade 😩' },
    { from: 'out', wait: 1500, time: '23:48', typing: 1300, text: 'Entendi! 📊 Com esse volume, dá pra responder 100% dos contatos em segundos e qualificar cada lead automaticamente. Qual seu nome e o segmento da loja?' },
    { from: 'in',  wait: 2200, time: '23:49', text: 'Marcos, loja de móveis planejados' },
    { from: 'out', wait: 1400, time: '23:50', typing: 1600, doc: { name: 'Proposta_Inovoxa_Marcos.pdf', size: '1 página · 214 KB' }, text: 'Perfeito, Marcos! ✅ Acabei de gerar sua proposta personalizada. Consigo também agendar uma demonstração de 15 min com nosso especialista — amanhã às 10h fica bom?' },
    { from: 'in',  wait: 2400, time: '23:51', text: 'Fica ótimo 👍' },
    { from: 'out', wait: 1300, time: '23:52', typing: 900, text: 'Agendado! 🗓️ O convite já está no seu WhatsApp e no calendário do especialista. Qualquer dúvida é só chamar — estou por aqui 24h. Boa noite, Marcos!' }
  ];

  const ticks = '<span class="ticks"><svg viewBox="0 0 16 11"><path d="M11.07.65l-6.2 6.2L2.6 4.6 1.3 5.9l3.57 3.56L12.37 1.95z"/><path d="M15.2.65L9 6.85l-.9-.9-1.3 1.3 2.2 2.2L16.5 1.95z"/></svg></span>';

  function buildMsg(m) {
    const div = document.createElement('div');
    div.className = 'msg msg-' + m.from;
    let inner = '';
    if (m.doc) {
      inner += `<div class="doc">${docIcon}<div><strong>${m.doc.name}</strong><em>${m.doc.size}</em></div></div>`;
    }
    inner += m.text;
    inner += `<div class="meta">${m.time}${m.from === 'out' ? ticks : ''}</div>`;
    div.innerHTML = inner;
    return div;
  }

  let convoTimer = null;
  function runConversation() {
    // limpa mensagens anteriores (mantém o separador "Hoje")
    chat.querySelectorAll('.msg, .typing').forEach(el => el.remove());
    phoneBadge.classList.remove('show');
    let delay = 600;

    script.forEach((m, i) => {
      // indicador "digitando…" antes das respostas da IA
      if (m.typing) {
        delay += m.wait;
        const tDelay = delay;
        convoTimer = setTimeout(() => {
          waStatus.textContent = 'digitando…';
          const tp = document.createElement('div');
          tp.className = 'typing';
          tp.innerHTML = '<i></i><i></i><i></i>';
          chat.appendChild(tp);
          requestAnimationFrame(() => tp.classList.add('show'));
          chat.scrollTop = chat.scrollHeight;
        }, tDelay);
        delay += m.typing;
      } else {
        delay += m.wait;
      }

      const showDelay = delay;
      setTimeout(() => {
        chat.querySelectorAll('.typing').forEach(el => el.remove());
        waStatus.textContent = 'online';
        const el = buildMsg(m);
        chat.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        chat.scrollTop = chat.scrollHeight;
        // confirma leitura das mensagens enviadas
        if (m.from === 'out') {
          setTimeout(() => el.classList.add('read'), 900);
        }
        // badge final + reinício do loop
        if (i === script.length - 1) {
          setTimeout(() => phoneBadge.classList.add('show'), 1200);
          setTimeout(runConversation, 9000);
        }
      }, showDelay);
    });
  }

  // inicia a conversa quando o telefone entra na tela
  const phoneObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      phoneObs.unobserve(e.target);
      runConversation();
    });
  }, { threshold: 0.35 });
  const phone = document.getElementById('phone');
  if (phone && chat) phoneObs.observe(phone);

  /* ══════════════════════════════════════════════
     AGENDAMENTO — Google Calendar + WhatsApp
     ══════════════════════════════════════════════ */
  const dateInput = document.getElementById('sd');
  if (dateInput) {
    const today = new Date();
    const minDate = new Date();
    minDate.setDate(today.getDate() + 1);
    while (minDate.getDay() === 0 || minDate.getDay() === 6) {
      minDate.setDate(minDate.getDate() + 1);
    }
    const iso = minDate.toISOString().split('T')[0];
    dateInput.min = iso;
    dateInput.value = iso;
    dateInput.addEventListener('change', function () {
      if (!this.value) return;
      const d = new Date(this.value + 'T12:00:00');
      if (d.getDay() === 0 || d.getDay() === 6) {
        alert('Por favor, selecione um dia útil (segunda a sexta-feira).');
        this.value = '';
      }
    });
  }

  let chosenSlot = '';
  document.querySelectorAll('.sl[data-t]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sl').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      chosenSlot = btn.dataset.t;
    });
  });

  const btnSched = document.getElementById('btn-sched');
  if (btnSched) btnSched.addEventListener('click', () => {
    const n = document.getElementById('sn').value.trim();
    const e = document.getElementById('se').value.trim();
    const interest = document.getElementById('si').value;
    const date = document.getElementById('sd').value;
    if (!n || !e || !interest || !date || !chosenSlot) {
      alert('Preencha todos os campos obrigatórios (*) e escolha um horário.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { alert('E-mail inválido.'); return; }

    const [y, m, d] = date.split('-');
    const [h, mi] = chosenSlot.split(':');
    const st = `${y}${m}${d}T${h}${mi}00`;
    const ed = new Date(date + 'T' + chosenSlot);
    ed.setMinutes(ed.getMinutes() + 30);
    const eh = String(ed.getHours()).padStart(2, '0');
    const emi = String(ed.getMinutes()).padStart(2, '0');
    const et = `${y}${m}${d}T${eh}${emi}00`;

    const comp = document.getElementById('sc').value.trim() || 'Não informado';
    const phone = document.getElementById('sw').value.trim() || 'Não informado';
    const msg = document.getElementById('sm').value.trim();
    const details = `Demonstração INOVOXA\n\nCliente: ${n}\nEmpresa: ${comp}\nWhatsApp: ${phone}\nInteresse: ${interest}${msg ? '\nMensagem: ' + msg : ''}`;

    const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Demonstração INOVOXA | ' + interest)}&dates=${st}/${et}&details=${encodeURIComponent(details)}&add=suporte%40inovoxa.com.br&sf=true`;
    window.open(gcal, '_blank');

    const waMsg = `Olá! Agendei uma demonstração.\n*Nome:* ${n}\n*Data:* ${d}/${m}/${y} às ${chosenSlot}\n*Interesse:* ${interest}\n*Empresa:* ${comp}${msg ? '\n*Mensagem:* ' + msg : ''}`;
    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send/?phone=5516981249881&text=${encodeURIComponent(waMsg)}`, '_blank');
    }, 1500);

    document.getElementById('form-body').style.display = 'none';
    document.getElementById('ok').classList.add('show');
    document.getElementById('ok-txt').innerHTML =
      `Demonstração para <strong>${d}/${m}/${y} às ${chosenSlot}</strong> registrada!<br>O Google Calendar foi aberto — adicione o evento ao seu calendário. Em seguida você recebe a confirmação no WhatsApp.`;
  });

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) btnReset.addEventListener('click', () => {
    document.getElementById('form-body').style.display = 'block';
    document.getElementById('ok').classList.remove('show');
    ['sn', 'se', 'sw', 'sc', 'sm'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('si').value = '';
    chosenSlot = '';
    document.querySelectorAll('.sl').forEach(b => b.classList.remove('on'));
    dateInput.value = dateInput.min;
  });

})();
