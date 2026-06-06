const data = window.PORTFOLIO_DATA || { places: [], photos: [], themes: [] };
const state = {
  page: "home",
  place: "all",
  theme: "all",
  search: "",
  activePlace: data.places[0]?.id || ""
};

const $ = (selector) => document.querySelector(selector);

function placeName(placeId) {
  return data.places.find((place) => place.id === placeId)?.name || placeId;
}

function getPlace(placeId) {
  return data.places.find((place) => place.id === placeId) || data.places[0];
}

function photosByPlace(placeId) {
  return data.photos.filter((photo) => photo.placeId === placeId);
}

function buildMapRouteSvg() {
  if (data.places.length < 2) return "";
  const routePath = data.places
    .map((place, index) => `${index === 0 ? "M" : "L"} ${place.mapPosition.x} ${place.mapPosition.y}`)
    .join(" ");

  return `
    <svg class="map-route-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path class="map-route-base" d="${routePath}"></path>
      <path class="map-route-glow" d="${routePath}"></path>
    </svg>
  `;
}

function setActiveMapPoint() {
  document.querySelectorAll(".map-point").forEach((point) => {
    point.classList.toggle("is-active", point.dataset.place === state.activePlace);
  });
}

function showPage(pageId) {
  state.page = pageId;
  document.querySelectorAll("[data-page]").forEach((page) => {
    page.classList.toggle("is-active", page.id === pageId);
  });
  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${pageId}`);
  });
  window.scrollTo({ top: 0, behavior: "instant" });
  observeRevealItems();
}

function syncPageFromHash() {
  const pageId = (location.hash || "#home").replace("#", "");
  const validPage = document.getElementById(pageId) ? pageId : "home";
  showPage(validPage);
}

function renderMap() {
  const board = $("#mapBoard");
  if (!board) return;

  board.innerHTML =
    buildMapRouteSvg() +
    data.places
    .map(
      (place) => `
      <button class="map-point" style="--x:${place.mapPosition.x}%;--y:${place.mapPosition.y}%" type="button" data-place="${place.id}">
        <span class="map-point-dot"></span>
        <span class="map-point-name">${place.name}</span>
        <span class="map-point-tip">${place.routeNote || place.summary}</span>
      </button>
    `
    )
    .join("");

  board.querySelectorAll(".map-point").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePlace = button.dataset.place;
      state.place = button.dataset.place;
      setActiveMapPoint();
      renderMapDetail(true);
    });
  });

  setActiveMapPoint();
  renderMapDetail();
}

function renderMapDetail(animated = false) {
  const detail = $("#mapDetail");
  if (!detail || !data.places.length) return;
  const place = getPlace(state.activePlace);
  const count = photosByPlace(place.id).length;

  const updateDetail = () => {
    detail.innerHTML = `
      <img class="reveal-photo" src="${place.coverImage}" alt="${place.name}" />
      <small>${place.englishName}</small>
      <h3>${place.name}</h3>
      <p>${place.summary}</p>
      <p>${place.routeNote || ""}</p>
      <a href="#gallery" data-gallery-place="${place.id}">${count} 张作品 / 进入作品</a>
    `;
    detail.querySelector("[data-gallery-place]").addEventListener("click", (event) => {
      state.place = event.currentTarget.dataset.galleryPlace;
      $("#placeFilter").value = state.place;
      renderGallery();
    });
    observeRevealItems();
    requestAnimationFrame(() => detail.classList.remove("is-changing"));
  };

  if (animated) {
    detail.classList.add("is-changing");
    window.setTimeout(updateDetail, 140);
  } else {
    updateDetail();
  }
}

function renderLetters() {
  const grid = $("#letterGrid");
  if (!grid) return;
  grid.innerHTML = data.places
    .map(
      (place) => `
      <article class="letter-card">
        <small>${place.englishName}</small>
        <h3>${place.name}说了什么</h3>
        <p>${place.summary}</p>
        <p>${place.note}</p>
      </article>
    `
    )
    .join("");
}

function renderFilters() {
  const placeFilter = $("#placeFilter");
  const themeFilter = $("#themeFilter");
  if (!placeFilter || !themeFilter) return;

  placeFilter.innerHTML = `<option value="all">全部地点</option>${data.places
    .map((place) => `<option value="${place.id}">${place.name}</option>`)
    .join("")}`;
  themeFilter.innerHTML = `<option value="all">全部主题</option>${data.themes
    .map((theme) => `<option value="${theme}">${theme}</option>`)
    .join("")}`;

  placeFilter.value = state.place;
  themeFilter.value = state.theme;
}

function filteredPhotos() {
  const keyword = state.search.trim().toLowerCase();
  return data.photos.filter((photo) => {
    const placeMatch = state.place === "all" || photo.placeId === state.place;
    const themeMatch = state.theme === "all" || photo.theme === state.theme;
    const text = [photo.title, photo.description, photo.theme, placeName(photo.placeId), photo.date].join(" ").toLowerCase();
    return placeMatch && themeMatch && (!keyword || text.includes(keyword));
  });
}

function renderGallery() {
  const grid = $("#photoGrid");
  const count = $("#photoCount");
  if (!grid) return;

  const photos = filteredPhotos();
  if (count) count.textContent = `当前显示 ${photos.length} 张`;

  grid.innerHTML = photos
    .map(
      (photo, index) => `
      <button class="photo-card" style="--reveal-delay:${Math.min(index * 24, 240)}ms" type="button" data-photo="${photo.id}">
        <img src="${photo.image}" alt="${photo.alt}" loading="lazy" />
        <span>
          <strong>${photo.title}</strong>
          <small>${placeName(photo.placeId)} / ${photo.date}</small>
        </span>
      </button>
    `
    )
    .join("");

  grid.querySelectorAll(".photo-card").forEach((card) => {
    card.addEventListener("click", () => openLightbox(card.dataset.photo));
  });
  observeRevealItems();
}

function renderJournal() {
  const list = $("#journalList");
  if (!list) return;
  const journalPhotos = data.photos
    .filter((photo) => ["手记", "归乡", "校园"].includes(photo.theme))
    .slice(0, 8);

  list.innerHTML = journalPhotos
    .map(
      (photo, index) => `
      <article class="journal-entry">
        <img class="reveal-photo" style="--reveal-delay:${index * 60}ms" src="${photo.image}" alt="${photo.alt}" loading="lazy" />
        <div>
          <small>${placeName(photo.placeId)} / ${photo.date}</small>
          <h3>${photo.title}</h3>
          <p>${photo.description}</p>
        </div>
      </article>
    `
    )
    .join("");
}

function renderFilm() {
  const strip = $("#filmStrip");
  if (!strip) return;
  strip.innerHTML = data.photos
    .filter((_, index) => index % 4 === 0)
    .slice(0, 42)
    .map(
      (photo, index) => `
      <article class="film-frame" style="--reveal-delay:${Math.min(index * 28, 260)}ms">
        <img class="reveal-photo" src="${photo.image}" alt="${photo.alt}" loading="lazy" />
        <strong>${String(index + 1).padStart(2, "0")} / ${photo.title}</strong>
        <small>${placeName(photo.placeId)} / ${photo.date}</small>
      </article>
    `
    )
    .join("");
}

function openLightbox(photoId) {
  const photo = data.photos.find((item) => item.id === photoId);
  const lightbox = $("#lightbox");
  if (!photo || !lightbox) return;

  $("#lightboxImage").src = photo.image;
  $("#lightboxImage").alt = photo.alt;
  $("#lightboxMeta").textContent = `${placeName(photo.placeId)} / ${photo.theme} / ${photo.date}`;
  $("#lightboxTitle").textContent = photo.title;
  $("#lightboxDesc").textContent = photo.description;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-lightbox");
}

function closeLightbox() {
  const lightbox = $("#lightbox");
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  $("#lightboxImage").removeAttribute("src");
  document.body.classList.remove("has-lightbox");
}

let revealObserver;
function observeRevealItems() {
  if (revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal-photo, .photo-card").forEach((item) => {
    revealObserver.observe(item);
  });
}

function bindEvents() {
  window.addEventListener("hashchange", syncPageFromHash);

  $("#placeFilter")?.addEventListener("change", (event) => {
    state.place = event.target.value;
    renderGallery();
  });
  $("#themeFilter")?.addEventListener("change", (event) => {
    state.theme = event.target.value;
    renderGallery();
  });
  $("#searchInput")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderGallery();
  });

  $("#lightboxClose")?.addEventListener("click", closeLightbox);
  $("#lightbox")?.addEventListener("click", (event) => {
    if (event.target.id === "lightbox") closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}

function init() {
  renderMap();
  renderLetters();
  renderFilters();
  renderGallery();
  renderJournal();
  renderFilm();
  bindEvents();
  syncPageFromHash();
}

init();
