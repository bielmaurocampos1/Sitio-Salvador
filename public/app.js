const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const body = document.body;
const header = $('.site-header');
const menuToggle = $('.menu-toggle');
const nav = $('.nav');

function updateHeader() {
  if (!header) return;
  header.classList.toggle('scrolled', window.scrollY > 30 || body.classList.contains('page-inner'));
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') nav.classList.remove('open');
  });
}

// Entrada cinematográfica da marca na home.
const intro = $('.intro-screen');
if (intro) {
  body.classList.add('is-locked');
  const closeIntro = () => {
    intro.classList.add('hide');
    body.classList.remove('is-locked');
    setTimeout(() => intro.remove(), 900);
  };
  const seenThisSession = sessionStorage.getItem('sitio-intro-seen');
  if (seenThisSession) {
    closeIntro();
  } else {
    sessionStorage.setItem('sitio-intro-seen', '1');
    setTimeout(closeIntro, 3000);
    intro.addEventListener('click', closeIntro, { once: true });
  }
}

// Animações de entrada conforme o scroll.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
$$('.reveal').forEach((el) => revealObserver.observe(el));

function sanitizeCaption(text = '') {
  return text.replace(/\s+/g, ' ').trim().slice(0, 180);
}

async function loadInstagram() {
  const grid = $('#instagram-grid');
  if (!grid) return;

  let items = [];
  try {
    const liveResponse = await fetch('api/instagram');
    if (liveResponse.ok && liveResponse.status !== 204) {
      const payload = await liveResponse.json();
      if (Array.isArray(payload.posts) && payload.posts.length) {
        items = payload.posts.map(post => ({
          image: post.media_url,
          caption: sanitizeCaption(post.caption) || 'Novo momento no Sítio Salvador.',
          href: post.permalink
        }));
      }
    }
  } catch (e) {
    console.info('Instagram ao vivo indisponível na prévia; usando galeria local.');
  }

  if (!items.length) {
    try {
      const fallback = await fetch('assets/instagram-fallback.json').then(r => r.json());
      items = fallback;
    } catch (e) {
      items = [
        { image: 'assets/images/hero-casamento.webp', caption: 'Celebrações ao ar livre, cercadas pela natureza.', href: 'https://www.instagram.com/espaco.sitiosalvador/' },
        { image: 'assets/images/mesa-floral.webp', caption: 'Detalhes pensados para transformar cada encontro.', href: 'https://www.instagram.com/espaco.sitiosalvador/' },
        { image: 'assets/images/bolo-branco.webp', caption: 'Casamentos com identidade, delicadeza e afeto.', href: 'https://www.instagram.com/espaco.sitiosalvador/' },
        { image: 'assets/images/gastronomia-1.webp', caption: 'Gastronomia que faz parte da experiência.', href: 'https://www.instagram.com/espaco.sitiosalvador/' },
        { image: 'assets/images/piscina-evento.webp', caption: 'Um espaço versátil para diferentes formatos de evento.', href: 'https://www.instagram.com/espaco.sitiosalvador/' },
        { image: 'assets/images/celeiro-entrada.webp', caption: 'Rusticidade, natureza e acolhimento em um só lugar.', href: 'https://www.instagram.com/espaco.sitiosalvador/' }
      ];
    }
  }

  grid.innerHTML = items.slice(0, 6).map(item => `
    <a class="insta-card" href="${item.href || '#'}" target="_blank" rel="noreferrer" aria-label="Abrir publicação no Instagram">
      <img src="${item.image}" alt="${sanitizeCaption(item.caption).replaceAll('"', '&quot;')}" loading="lazy">
      <div class="insta-overlay"><p>${sanitizeCaption(item.caption)}</p></div>
    </a>
  `).join('');
}
loadInstagram();

// Formulário de demonstração — pronto para conectar a e-mail, WhatsApp ou CRM.
const contactForm = $('#contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const submit = $('button[type="submit"]', contactForm);
    const original = submit.textContent;
    submit.textContent = 'Solicitação preparada ✓';
    submit.disabled = true;
    setTimeout(() => {
      submit.textContent = original;
      submit.disabled = false;
    }, 2600);
  });
}
