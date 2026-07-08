// ---------------------------------------------------------------
// Motion starter: Lenis smooth scroll + GSAP ScrollTrigger
// + custom cursor + magnetic buttons + parallax + pinned sections
// ---------------------------------------------------------------

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none)").matches;

gsap.registerPlugin(ScrollTrigger);

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

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.set(dot, { x: mouseX, y: mouseY });
  });

  window.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
  window.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));

  gsap.ticker.add(() => {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
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
  duration: 18,
  repeat: -1,
});

// ---------- Word-by-word reveal, pinned ----------
const words = gsap.utils.toArray("[data-word]");
if (words.length) {
  ScrollTrigger.create({
    trigger: ".about-pin",
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

// ---------- Horizontal pinned gallery ----------
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

  // Parallax panels moving at different speeds within the horizontal track
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

// ---------- Feature card stagger ----------
gsap.utils.toArray(".feature-grid").forEach((grid) => {
  const cards = grid.querySelectorAll(".feature-card");
  gsap.to(cards, {
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

// Refresh ScrollTrigger once everything (fonts/layout) has settled
window.addEventListener("load", () => ScrollTrigger.refresh());
