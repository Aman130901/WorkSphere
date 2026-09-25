/* ============================================================
   WorkSphere — Global JavaScript
   Lenis Smooth Scroll + Scroll Animations + 3D Effects
   ============================================================ */

// ─── 1. LENIS SMOOTH SCROLLING ─────────────────────────────
(function initLenis() {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js";
  script.onload = () => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;
  };
  document.head.appendChild(script);
})();

// ─── 2. DOMContentLoaded Logic ──────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  // INTERSECTION OBSERVER — scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { rootMargin: "0px 0px -60px 0px", threshold: 0.08 });
  document.querySelectorAll(".animate-on-scroll").forEach(el => observer.observe(el));

  // 3D TILT EFFECT
  document.querySelectorAll(".pricing-card, .resource-card, .tool-item, .feature-card, .award-item, .feature-box, .feat-card").forEach(card => {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top - r.height/2) / (r.height/2)) * -8;
      const ry = ((e.clientX - r.left - r.width/2) / (r.width/2)) * 8;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px) scale(1.02)`;
      card.style.transition = "transform 0.1s ease";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.transition = "transform 0.4s ease";
    });
  });

  // MOUSE PARALLAX
  document.addEventListener("mousemove", e => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    document.querySelectorAll(".parallax-float").forEach((el, i) => {
      const f = (i+1)*5;
      el.style.transform = `translate(${(x-0.5)*f}px, ${(y-0.5)*f}px)`;
      el.style.transition = "transform 0.15s linear";
    });
    document.querySelectorAll(".card").forEach((card, i) => {
      const f = (i+1)*3;
      card.style.transform = `translate(${(x-0.5)*f}px, ${(y-0.5)*f}px)`;
    });
  });

  // NAVBAR SCROLL SHRINK
  const navbar = document.querySelector(".navbar, .site-header, header");
  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);
    }, { passive: true });
  }

  // SMOOTH ANCHOR LINKS
  document.querySelectorAll("a[href^=\"#\"]").forEach(anchor => {
    anchor.addEventListener("click", e => {
      const t = document.querySelector(anchor.getAttribute("href"));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
  });

  // FAQ ACCORDION
  const faqHeaders = document.querySelectorAll(".clean-accordion-header");
  faqHeaders.forEach(header => {
    header.addEventListener("click", () => {
      const item = header.closest(".clean-accordion-item");
      const content = item ? item.querySelector(".clean-accordion-content") : null;
      const chevron = header.querySelector(".chevron");
      const isOpen = content && content.style.display === "block";
      document.querySelectorAll(".clean-accordion-content").forEach(c => c.style.display = "none");
      document.querySelectorAll(".clean-accordion-header .chevron").forEach(c => c.textContent = "v");
      if (!isOpen && content) { content.style.display = "block"; if (chevron) chevron.textContent = "^"; }
    });
  });

  // OLD FAQ
  document.querySelectorAll(".faq-question").forEach(item => {
    item.addEventListener("click", () => {
      const ans = item.nextElementSibling;
      const plus = item.querySelector(".plus");
      if (!ans) return;
      if (ans.style.display === "block") { ans.style.display = "none"; if (plus) plus.style.transform = "rotate(0deg)"; }
      else { ans.style.display = "block"; if (plus) plus.style.transform = "rotate(45deg)"; }
    });
  });

  // COMPARE TABLE ACCORDION
  const catHeaders = document.querySelectorAll(".category-header");
  if (catHeaders.length > 0) {
    catHeaders.forEach((header, i) => {
      header.addEventListener("click", () => {
        const tr = header.closest("tr");
        const wasClosed = tr.classList.contains("closed");
        document.querySelectorAll(".category-row").forEach(row => {
          row.classList.add("closed");
          const ch = row.querySelector(".chevron"); if (ch) ch.textContent = "v";
          let n = row.nextElementSibling;
          while (n && !n.classList.contains("category-row")) { n.style.display = "none"; n = n.nextElementSibling; }
        });
        if (wasClosed) {
          tr.classList.remove("closed");
          const ch = header.querySelector(".chevron"); if (ch) ch.textContent = "^";
          let n = tr.nextElementSibling;
          while (n && !n.classList.contains("category-row")) { n.style.display = "table-row"; n = n.nextElementSibling; }
        }
      });
      if (i !== 0) {
        const tr = header.closest("tr"); tr.classList.add("closed");
        const ch = header.querySelector(".chevron"); if (ch) ch.textContent = "v";
        let n = tr.nextElementSibling;
        while (n && !n.classList.contains("category-row")) { n.style.display = "none"; n = n.nextElementSibling; }
      } else { const ch = header.querySelector(".chevron"); if (ch) ch.textContent = "^"; }
    });
  }

  // BILLING TOGGLE
  const toggleBtns = document.querySelectorAll(".billing-toggle-pill .toggle-btn");
  toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      toggleBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".pricing-card").forEach(card => {
        card.style.opacity = "0.6"; card.style.transform = "scale(0.98)";
        setTimeout(() => { card.style.opacity = "1"; card.style.transform = ""; }, 250);
      });
    });
  });

  // TESTIMONIAL CAROUSEL
  const carousel = document.querySelector(".test-carousel");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");
  const dots = document.querySelectorAll(".test-pagination .dot");
  if (carousel && prevBtn && nextBtn) {
    let isAnim = false;
    const updateDots = () => {
      const cards = Array.from(carousel.children);
      cards.forEach(c => c.classList.remove("active"));
      if (cards[1]) cards[1].classList.add("active");
      const ai = cards[1] ? (cards[1].getAttribute("data-index") || 1) : 1;
      dots.forEach((d, idx) => { d.classList.toggle("active", idx==ai); d.style.width = idx==ai?"30px":"10px"; d.style.borderRadius = idx==ai?"5px":"50%"; d.style.background = idx==ai?"#1a4f52":"#e8f4f1"; });
    };
    Array.from(carousel.children).forEach((card, idx) => card.setAttribute("data-index", idx));
    nextBtn.addEventListener("click", () => {
      if (isAnim) return; isAnim = true;
      const first = carousel.firstElementChild;
      carousel.style.transition = "transform 0.4s ease-in-out";
      carousel.style.transform = `translateX(-${first.offsetWidth}px)`;
      setTimeout(() => { carousel.style.transition = "none"; carousel.appendChild(first); carousel.style.transform = "translateX(0)"; updateDots(); isAnim = false; }, 400);
    });
    prevBtn.addEventListener("click", () => {
      if (isAnim) return; isAnim = true;
      const last = carousel.lastElementChild;
      carousel.prepend(last); carousel.style.transition = "none"; carousel.style.transform = `translateX(-${last.offsetWidth}px)`;
      void carousel.offsetWidth;
      carousel.style.transition = "transform 0.4s ease-in-out"; carousel.style.transform = "translateX(0)";
      setTimeout(() => { updateDots(); isAnim = false; }, 400);
    });
  }

  // RESOURCES SEARCH
  const searchInput = document.querySelector(".search-mockup input");
  const searchBtn = document.querySelector(".search-mockup button");
  if (searchInput && searchBtn) {
    const filter = () => {
      const q = searchInput.value.toLowerCase().trim();
      document.querySelectorAll(".resource-card, .featured-card").forEach(c => { c.style.display = c.textContent.toLowerCase().includes(q) ? "" : "none"; });
    };
    searchBtn.addEventListener("click", filter);
    searchInput.addEventListener("input", filter);
    searchInput.addEventListener("keyup", e => { if (e.key === "Enter") filter(); });
  }

  // BUTTON RIPPLE EFFECT
  document.querySelectorAll(".btn, .btn-primary, .btn-secondary").forEach(btn => {
    btn.addEventListener("click", function(e) {
      const ripple = document.createElement("span");
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,255,255,0.3);top:${e.clientY-rect.top-size/2}px;left:${e.clientX-rect.left-size/2}px;transform:scale(0);pointer-events:none;animation:rippleAnim 0.6s ease-out forwards;`;
      this.style.position = "relative"; this.style.overflow = "hidden";
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });

  // COUNTER ANIMATION
  const counters = document.querySelectorAll(".stat-number, .counter");
  if (counters.length > 0) {
    const cObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.textContent.replace(/[^0-9.]/g, ""));
        const suffix = el.textContent.replace(/[0-9.]/g, "");
        let start = 0;
        const step = ts => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / 2000, 1);
          const val = progress * target;
          el.textContent = (val % 1 === 0 ? Math.floor(val) : val.toFixed(1)) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        cObs.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cObs.observe(c));
  }

  // STAGGERED GRID ITEMS
  document.querySelectorAll(".tool-item, .resource-card, .feat-card, .feature-box").forEach((el, i) => {
    el.style.transitionDelay = `${i * 80}ms`;
  });

  // INJECT RIPPLE KEYFRAME
  if (!document.getElementById("ripple-style")) {
    const s = document.createElement("style");
    s.id = "ripple-style";
    s.textContent = "@keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }";
    document.head.appendChild(s);
  }

});
