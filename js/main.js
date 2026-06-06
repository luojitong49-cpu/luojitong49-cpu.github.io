const data = window.PORTFOLIO_DATA || { places: [], photos: [], themes: [] };
const state = {
  page: "home",
  place: "all",
  theme: "all",
  search: "",
  activePlace: data.places[0]?.id || ""
};
const lightboxState = {
  photos: [],
  index: -1
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
  document.body.dataset.currentPage = pageId;
  document.querySelectorAll("[data-page]").forEach((page) => {
    page.classList.toggle("is-active", page.id === pageId);
  });
  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${pageId}`);
  });
  window.scrollTo({ top: 0, behavior: "instant" });
  observeRevealItems();
  if (pageId === "film") playFilmUnspool();
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
    card.addEventListener("click", () => openLightbox(card.dataset.photo, photos));
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
  const filmPhotos = data.photos
    .filter((_, index) => index % 4 === 0)
    .slice(0, 42);

  const reels = [filmPhotos.slice(0, 14), filmPhotos.slice(14, 28), filmPhotos.slice(28, 42)];
  strip.innerHTML = reels
    .map((reelPhotos, reelIndex) => {
      const startNumber = reelIndex * 14;
      return `
        <section class="film-reel-block">
          <div class="film-reel-label">
            <span>ROLL ${String(reelIndex + 1).padStart(2, "0")}</span>
            <small>${reelPhotos.length} frames / drag to unspool</small>
          </div>
          <div class="film-reel" data-reel="${reelIndex}">
            ${reelPhotos
              .map(
                (photo, index) => `
                <button class="film-frame" style="--frame:${startNumber + index};--reveal-delay:${Math.min(index * 34, 260)}ms" type="button" data-photo="${photo.id}">
                  <span class="film-frame-number">${String(startNumber + index + 1).padStart(2, "0")}</span>
                  <img class="reveal-photo" src="${photo.image}" alt="${photo.alt}" loading="lazy" />
                  <strong>${photo.title}</strong>
                  <small>${placeName(photo.placeId)} / ${photo.date}</small>
                </button>
              `
              )
              .join("")}
            <div class="film-reel-tail" aria-hidden="true">
              <span></span>
              <strong>未展开</strong>
              <small>Pull the film</small>
            </div>
          </div>
        </section>
      `;
    })
    .join("");

  strip.querySelectorAll(".film-reel").forEach((reel) => {
    const reelPhotos = reels[Number(reel.dataset.reel)] || filmPhotos;
    reel.querySelectorAll(".film-frame").forEach((frame) => {
      frame.addEventListener("click", (event) => {
        if (reel.dataset.dragMoved === "true") {
          event.preventDefault();
          return;
        }
        openLightbox(frame.dataset.photo, reelPhotos);
      });
    });
    bindFilmDrag(reel);
  });

  playFilmUnspool();
}

function playFilmUnspool() {
  const reels = document.querySelectorAll(".film-reel");
  reels.forEach((reel, index) => {
    reel.classList.remove("is-unspooled");
    void reel.offsetWidth;
    reel.style.setProperty("--unspool-delay", `${index * 160}ms`);
    reel.classList.add("is-unspooled");
  });
}

function bindFilmDrag(strip) {
  if (strip.dataset.dragBound === "true") return;
  strip.dataset.dragBound = "true";
  strip.dataset.dragMoved = "false";

  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  strip.addEventListener("pointerdown", (event) => {
    isDown = true;
    moved = false;
    strip.dataset.dragMoved = "false";
    startX = event.clientX;
    startScroll = strip.scrollLeft;
    strip.classList.add("is-dragging");
    strip.setPointerCapture?.(event.pointerId);
  });

  strip.addEventListener("pointermove", (event) => {
    if (!isDown) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) > 8) moved = true;
    strip.scrollLeft = startScroll - distance;
  });

  const endDrag = (event) => {
    if (!isDown) return;
    isDown = false;
    strip.classList.remove("is-dragging");
    strip.releasePointerCapture?.(event.pointerId);
    strip.dataset.dragMoved = moved ? "true" : "false";
    if (moved) window.setTimeout(() => { strip.dataset.dragMoved = "false"; }, 140);
  };

  strip.addEventListener("pointerup", endDrag);
  strip.addEventListener("pointercancel", endDrag);
  strip.addEventListener("pointerleave", endDrag);
}

function updateLightboxNav() {
  const total = lightboxState.photos.length;
  const prevButton = $("#lightboxPrev");
  const nextButton = $("#lightboxNext");
  if (!prevButton || !nextButton) return;

  prevButton.disabled = total < 2;
  nextButton.disabled = total < 2;
  prevButton.setAttribute("aria-label", total < 2 ? "没有上一张照片" : "上一张照片");
  nextButton.setAttribute("aria-label", total < 2 ? "没有下一张照片" : "下一张照片");
}

function playLightboxSwitch(direction = 0) {
  const lightbox = $("#lightbox");
  if (!lightbox) return;
  lightbox.dataset.direction = direction < 0 ? "prev" : "next";
  lightbox.classList.remove("is-switching");
  void lightbox.offsetWidth;
  lightbox.classList.add("is-switching");
  window.setTimeout(() => lightbox.classList.remove("is-switching"), 360);
}

function renderLightboxPhoto(photo, direction = 0) {
  $("#lightboxImage").src = photo.image;
  $("#lightboxImage").alt = photo.alt;
  $("#lightboxMeta").textContent = `${lightboxState.index + 1} / ${lightboxState.photos.length} · ${placeName(photo.placeId)} / ${photo.theme} / ${photo.date}`;
  $("#lightboxTitle").textContent = photo.title;
  $("#lightboxDesc").textContent = photo.description;
  updateLightboxNav();
  playLightboxSwitch(direction);
}

function openLightbox(photoId, photoGroup = data.photos) {
  const photo = data.photos.find((item) => item.id === photoId);
  const lightbox = $("#lightbox");
  if (!photo || !lightbox) return;

  lightboxState.photos = photoGroup.length ? photoGroup : data.photos;
  lightboxState.index = lightboxState.photos.findIndex((item) => item.id === photoId);
  if (lightboxState.index < 0) {
    lightboxState.photos = data.photos;
    lightboxState.index = data.photos.findIndex((item) => item.id === photoId);
  }
  renderLightboxPhoto(lightboxState.photos[lightboxState.index], 0);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-lightbox");
}

function stepLightbox(direction) {
  const lightbox = $("#lightbox");
  const total = lightboxState.photos.length;
  if (!lightbox?.classList.contains("is-open") || total < 2) return;

  lightboxState.index = (lightboxState.index + direction + total) % total;
  renderLightboxPhoto(lightboxState.photos[lightboxState.index], direction);
}

function closeLightbox() {
  const lightbox = $("#lightbox");
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  $("#lightboxImage").removeAttribute("src");
  document.body.classList.remove("has-lightbox");
  lightboxState.photos = [];
  lightboxState.index = -1;
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
  $("#lightboxPrev")?.addEventListener("click", () => stepLightbox(-1));
  $("#lightboxNext")?.addEventListener("click", () => stepLightbox(1));
  $("#lightbox")?.addEventListener("click", (event) => {
    if (event.target.id === "lightbox") closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
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
