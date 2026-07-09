// ---------------------------------------------------------------
// Zenith Intelligence — motion system
// Lenis smooth scroll + GSAP ScrollTrigger + custom cursor +
// neural-network canvas + scroll-scrubbed video + assembling team
// ---------------------------------------------------------------

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none)").matches;

gsap.registerPlugin(ScrollTrigger);

// Shared pointer state — written by the cursor block, read by the node network
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };

// ---------- Lenis smooth scroll ----------
let lenis;
if (!prefersReducedMotion) {
  lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

// ---------- Scroll progress bar ----------
gsap.to("#progress-bar", {
  scaleX: 1,
  ease: "none",
  scrollTrigger: {
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
  },
});

// ---------- Custom cursor ----------
const cursor = document.getElementById("cursor");

if (!isTouch && cursor) {
  const dot = cursor.querySelector(".cursor-dot");
  const ring = cursor.querySelector(".cursor-ring");

  let ringX = pointer.x;
  let ringY = pointer.y;

  window.addEventListener("mousemove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    gsap.set(dot, { x: pointer.x, y: pointer.y });
  });

  window.addEventListener("mouseleave", () => {
    pointer.active = false;
    cursor.classList.add("is-hidden");
  });
  window.addEventListener("mouseenter", () => {
    pointer.active = true;
    cursor.classList.remove("is-hidden");
  });

  gsap.ticker.add(() => {
    ringX += (pointer.x - ringX) * 0.18;
    ringY += (pointer.y - ringY) * 0.18;
    gsap.set(ring, { x: ringX, y: ringY });
  });

  document.querySelectorAll("[data-cursor='hover']").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
}

// ---------- Magnetic buttons ----------
if (!isTouch) {
  document.querySelectorAll(".magnetic").forEach((btn) => {
    const strength = 30;

    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: (relX / rect.width) * strength,
        y: (relY / rect.height) * strength,
        duration: 0.4,
        ease: "power3.out",
      });
    });

    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    });
  });
}

// ---------- Neural-network canvas (cursor tracking) ----------
function initNodeNetwork() {
  document.querySelectorAll(".node-network").forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    const density = parseFloat(canvas.dataset.density) || 1;
    const maxDist = parseFloat(canvas.dataset.maxDistance) || 130;
    const repelRadius = parseFloat(canvas.dataset.repelRadius) || 160;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let nodes = [];
    let w = 0, h = 0;
    let pageVisible = !document.hidden;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createNodes();
    }

    function createNodes() {
      const mobileFactor = window.innerWidth < 700 ? 0.5 : 1;
      const count = Math.round(
        Math.min(110, Math.max(40, (w * h) / 12000)) * density * mobileFactor
      );
      nodes = Array.from({ length: count }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return {
          x, y,
          hx: x, hy: y, // home position — nodes drift back here after being repelled
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.2 + Math.random() * 1.6,
        };
      });
    }

    function stepNodes() {
      const rect = canvas.getBoundingClientRect();
      const px = pointer.x - rect.left;
      const py = pointer.y - rect.top;
      const repel = !isTouch && pointer.active;

      for (const n of nodes) {
        n.vx += (Math.random() - 0.5) * 0.04;
        n.vy += (Math.random() - 0.5) * 0.04;

        if (repel) {
          const dx = n.x - px;
          const dy = n.y - py;
          const d = Math.hypot(dx, dy);
          if (d < repelRadius && d > 0.001) {
            const force = ((repelRadius - d) / repelRadius) * 0.35;
            n.vx += (dx / d) * force;
            n.vy += (dy / d) * force;
          }
        }

        // Gentle spring back toward home so repelled nodes slowly reform
        // instead of leaving a permanent blank space behind the cursor
        n.vx += (n.hx - n.x) * 0.004;
        n.vy += (n.hy - n.y) * 0.004;

        n.vx *= 0.95;
        n.vy *= 0.95;
        n.x += n.vx;
        n.y += n.vy;
      }
    }

    function drawFrame() {
      ctx.clearRect(0, 0, w, h);
      const rect = canvas.getBoundingClientRect();
      const px = pointer.x - rect.left;
      const py = pointer.y - rect.top;
      const glow = !isTouch && pointer.active;

      // Cursor glow blob
      if (glow && px > -100 && px < w + 100 && py > -100 && py < h + 100) {
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 180);
        grad.addColorStop(0, "rgba(61, 109, 255, 0.14)");
        grad.addColorStop(1, "rgba(61, 109, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(px - 180, py - 180, 360, 360);
      }

      // Lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < maxDist) {
            let alpha = (1 - d / maxDist) * 0.22;
            if (glow) {
              const mid = Math.hypot((a.x + b.x) / 2 - px, (a.y + b.y) / 2 - py);
              if (mid < repelRadius) alpha += (1 - mid / repelRadius) * 0.35;
            }
            ctx.strokeStyle = `rgba(111, 143, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        let alpha = 0.5;
        if (glow) {
          const d = Math.hypot(n.x - px, n.y - py);
          if (d < repelRadius) alpha += (1 - d / repelRadius) * 0.5;
        }
        ctx.fillStyle = `rgba(111, 143, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();
    window.addEventListener("resize", resize);

    if (prefersReducedMotion) {
      // One static frame, no animation
      drawFrame();
      return;
    }

    document.addEventListener("visibilitychange", () => {
      pageVisible = !document.hidden;
    });

    gsap.ticker.add(() => {
      if (!pageVisible) return;
      stepNodes();
      drawFrame();
    });
  });
}
initNodeNetwork();

// ---------- Logo scroll-scrub video ----------
function initLogoScrub() {
  const video = document.getElementById("logo-video");
  if (!video) return;

  if (prefersReducedMotion) {
    video.controls = true;
    return;
  }

  let duration = 0;
  let targetTime = 0;
  let currentTime = 0;

  video.addEventListener("loadedmetadata", () => {
    duration = video.duration;
  });
  // In case metadata is already loaded by the time we attach
  if (video.readyState >= 1) duration = video.duration;

  ScrollTrigger.create({
    trigger: ".logo-scrub",
    start: "top top",
    end: "+=800",
    pin: ".logo-scrub-pin",
    scrub: true,
    onUpdate: (self) => {
      if (duration) targetTime = self.progress * duration;
    },
  });

  // Smooth the seek target so playback reads as motion, not stutter
  gsap.ticker.add(() => {
    if (!duration || video.seeking) return;
    currentTime += (targetTime - currentTime) * 0.14;
    if (Math.abs(video.currentTime - currentTime) > 0.01) {
      video.currentTime = currentTime;
    }
  });
}
initLogoScrub();

// ---------- Hero title split reveal ----------
document.querySelectorAll(".hero-title .line").forEach((line, i) => {
  gsap.from(line, {
    yPercent: 120,
    duration: 1,
    ease: "power4.out",
    delay: 0.15 * i + 0.1,
  });
});

// ---------- Generic [data-reveal] fade-up ----------
gsap.utils.toArray("[data-reveal]").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: "power3.out",
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
      toggleActions: "play none none reverse",
    },
  });
});

// Hero elements should reveal immediately on load, not on scroll
document.querySelectorAll(".hero [data-reveal]").forEach((el, i) => {
  gsap.to(el, { opacity: 1, y: 0, duration: 0.9, delay: 0.5 + i * 0.12, ease: "power3.out" });
});

// ---------- Marquee auto-scroll ----------
gsap.to(".marquee-track", {
  xPercent: -100,
  ease: "none",
  duration: 22,
  repeat: -1,
});

// ---------- Manifesto: word-by-word reveal, pinned ----------
const words = gsap.utils.toArray("[data-word]");
if (words.length) {
  ScrollTrigger.create({
    trigger: ".manifesto-pin",
    start: "top top",
    end: `+=${words.length * 40}`,
    pin: true,
    scrub: 0.3,
    onUpdate: (self) => {
      const activeCount = Math.floor(self.progress * words.length);
      words.forEach((w, i) => w.classList.toggle("is-active", i < activeCount));
    },
  });
}

// ---------- Services: horizontal pinned gallery ----------
const track = document.getElementById("horizontal-track");
if (track) {
  const getScrollDistance = () => track.scrollWidth - window.innerWidth;

  const horizontalTween = gsap.to(track, {
    x: () => -getScrollDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: ".work",
      start: "top top",
      end: () => `+=${getScrollDistance()}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  gsap.utils.toArray(".panel").forEach((panel) => {
    const speed = parseFloat(panel.dataset.speed) || 1;
    gsap.to(panel.querySelector(".panel-card"), {
      xPercent: (speed - 1) * 20,
      ease: "none",
      scrollTrigger: {
        trigger: panel,
        containerAnimation: horizontalTween,
        start: "left right",
        end: "right left",
        scrub: true,
      },
    });
  });
}

// ---------- Team: assembling photos ----------
function initTeamAssembly() {
  const cards = gsap.utils.toArray(".team-card[data-from]");
  if (!cards.length) return;

  const isNarrow = window.innerWidth < 820;

  if (prefersReducedMotion || isNarrow) {
    // Fall back to the plain fade-up treatment (cards stack on mobile,
    // so directional fly-in and pinning read poorly there)
    cards.forEach((card) => {
      gsap.to(card, {
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 85%" },
      });
    });
    return;
  }

  const offsets = { left: { x: "-70vw", y: "6vh" }, right: { x: "70vw", y: "6vh" }, top: { x: "0", y: "-80vh" } };

  cards.forEach((card) => {
    const from = offsets[card.dataset.from] || offsets.left;
    gsap.set(card, {
      x: from.x,
      y: from.y,
      rotate: parseFloat(card.dataset.rotate) || 0,
      scale: 0.85,
      opacity: 0,
    });
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".team-assembly",
      start: "top top",
      end: "+=1200",
      pin: true,
      scrub: 1,
    },
  });

  cards.forEach((card, i) => {
    tl.to(
      card,
      { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, ease: "power2.out", duration: 1 },
      i * 0.22
    );
  });
}
initTeamAssembly();

// ---------- Stagger grids (features, testimonials, chips) ----------
gsap.utils.toArray("[data-stagger-grid]").forEach((grid) => {
  const items = grid.querySelectorAll("[data-stagger-item]");
  gsap.to(items, {
    opacity: 1,
    y: 0,
    stagger: 0.08,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: grid,
      start: "top 85%",
    },
  });
});

// ---------- Avatar demo: autoplay muted while in view ----------
(function initAvatarPlayer() {
  const video = document.getElementById("avatar-video");
  if (!video) return;

  if (prefersReducedMotion) return; // user opts out of auto-motion; controls remain

  new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.35 }
  ).observe(video);
})();

// ---------- Contact form (Formspree, progressive enhancement) ----------
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");
  const submitBtn = form.querySelector("button[type='submit']");
  const FALLBACK =
    'Something went wrong — please email us directly at <a href="mailto:zenithintelligence.automation@gmail.com">zenithintelligence.automation@gmail.com</a>.';

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "Sending…";
    submitBtn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        status.className = "form-status is-success";
        status.textContent = "Message sent — we'll get back to you within a day. Asante!";
        form.reset();
      } else {
        status.className = "form-status is-error";
        status.innerHTML = FALLBACK;
      }
    } catch {
      status.className = "form-status is-error";
      status.innerHTML = FALLBACK;
    } finally {
      submitBtn.disabled = false;
    }
  });
}
initContactForm();

// Refresh ScrollTrigger once everything (fonts/layout) has settled
window.addEventListener("load", () => ScrollTrigger.refresh());
