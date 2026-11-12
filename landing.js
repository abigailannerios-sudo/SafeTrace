// ==========================================================================
// js/landing.js : HOME LANDING PAGE: carousel, scroll-spy & navigation to the donor page
// ==========================================================================
// 1. Carousel Interaction (Slide transitions and touch swipe)
let currentExecSlide = 0;
const execTrack = document.getElementById("execCarouselTrack");
const execDots = document.querySelectorAll(".exec-pagination-dot");
const totalExecSlides = 3;

function goToCarouselSlide(index) {
  currentExecSlide = (index + totalExecSlides) % totalExecSlides;
  execTrack.style.transform = `translateX(-${currentExecSlide * 100}%)`;
  execDots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentExecSlide);
  });
}

// Touch and swipe support for mobile/trackpad devices
let touchStartX = 0;
let touchEndX = 0;
const execCarouselViewport = document.getElementById("execCarouselViewport");

execCarouselViewport.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.changedTouches[0].screenX;
  },
  { passive: true },
);

execCarouselViewport.addEventListener(
  "touchend",
  (e) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchStartX - touchEndX > 45) {
      goToCarouselSlide(currentExecSlide + 1); // Swipe left
    } else if (touchEndX - touchStartX > 45) {
      goToCarouselSlide(currentExecSlide - 1); // Swipe right
    }
  },
  { passive: true },
);

// 2. ScrollSpy: Highlight active navigation link in sticky navbar
const pageSections = document.querySelectorAll("section");
const pageNavLinks = document.querySelectorAll(".landing-nav-link");

function updateActiveNav() {
  let currentSectionId = "";
  const scrollPos = window.scrollY + 100;
  // If the user reaches or is near the bottom of the page, prioritize #about-us
  const isAtBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 60;

  if (isAtBottom) {
    currentSectionId = "about-us";
  } else {
    pageSections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentSectionId = sec.getAttribute("id");
      }
    });
  }

  pageNavLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${currentSectionId}`) {
      link.classList.add("active");
    }
  });
}

window.addEventListener("scroll", updateActiveNav, { passive: true });
window.addEventListener("load", updateActiveNav);

// Immediate underline highlight when clicking a navbar item
pageNavLinks.forEach((link) => {
  link.addEventListener("click", function () {
    pageNavLinks.forEach((l) => l.classList.remove("active"));
    this.classList.add("active");
  });
});

// 3. Navigation Hook to Donor Side (Part 2)
function openDonorPortal() {
  // Opens the Donor Welcome Page (donor.html)
  window.location.href = "donor.html";
}
