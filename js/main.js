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
const EXCLUDED_PHOTO_IDS = new Set(["laoyuhe-05", "laoyuhe-06", "laoyuhe-07", "laoyuhe-08"]);
const JOURNAL_SELECTION = [
  {
    id: "zhenping-01",
    title: "孩子看镜头的那一秒",
    text: "这张我会保留。它没有复杂构图，只有一个很直接的眼神，像旅途中突然被生活叫住。"
  },
  {
    id: "kmust-08",
    title: "红旗和蓝天",
    text: "红色很亮，天空很干净，放在手记里像一个明确的标点：那天的天气确实不错。"
  },
  {
    id: "dounan-45",
    title: "白色兰花的暗部",
    text: "花不一定要拍得热闹。这张更安静，黑背景把花瓣托出来，像走进市场后忽然听见的低声。"
  },
  {
    id: "dounan-56",
    title: "一束小菊的颜色",
    text: "它有一种轻快的秩序感：很多颜色挤在一起，但没有乱，像旅途里很小的一点开心。"
  },
  {
    id: "shaolinsi-08",
    title: "斗拱下面的红与蓝",
    text: "古建筑最迷人的地方是结构。颜色很重，线条很稳，看起来比语言更有耐心。"
  },
  {
    id: "shaolinsi-15",
    title: "塔林的影子",
    text: "石头、阳光和阴影站在一起，画面不吵，但时间感很重，适合放进手记里慢慢看。"
  },
  {
    id: "haiyan-40",
    title: "海面上的一排人",
    text: "这张有风景，也有人。远处的队列让水面有了方向，不只是好看，还有一点等待感。"
  },
  {
    id: "haiyan-47",
    title: "海边桌上的灯",
    text: "天快暗下来的时候，灯比风景更像主角。它把一小块桌面照亮，也把那天留住。"
  }
];
const FILM_REELS = [
  {
    title: "ROLL 01 / 黑白胶卷",
    note: "Black & White",
    ids: ["haiyan-02", "haiyan-03", "haiyan-04", "haiyan-05", "haiyan-06", "haiyan-07", "haiyan-08", "kmust-02", "kmust-03", "kmust-04", "zhenping-04", "zhenping-05"]
  },
  {
    title: "ROLL 02 / 花蕊胶卷",
    note: "Flower Details",
    ids: ["dounan-32", "dounan-33", "dounan-36", "dounan-41", "dounan-42", "dounan-43", "dounan-45", "dounan-47", "dounan-48", "dounan-49", "dounan-52", "dounan-56"]
  },
  {
    title: "ROLL 03 / 风景胶卷",
    note: "Landscape",
    ids: ["haiyan-09", "haiyan-10", "haiyan-13", "haiyan-21", "haiyan-40", "haiyan-47", "haiyan-48", "wulongcun-01", "wulongcun-02", "wulongcun-03", "laoyuhe-01", "laoyuhe-02"]
  },
  {
    title: "ROLL 04 / 古建筑胶卷",
    note: "Ancient Architecture",
    ids: ["shaolinsi-05", "shaolinsi-06", "shaolinsi-08", "shaolinsi-09", "shaolinsi-10", "shaolinsi-11", "shaolinsi-13", "shaolinsi-15", "shaolinsi-16", "haiyan-28", "haiyan-30", "haiyan-33"]
  }
];

const $ = (selector) => document.querySelector(selector);

function visiblePhotos() {
  return data.photos.filter((photo) => !EXCLUDED_PHOTO_IDS.has(photo.id));
}

function photoById(id) {
  return visiblePhotos().find((photo) => photo.id === id);
}

function placeName(placeId) {
  return data.places.find((place) => place.id === placeId)?.name || placeId;
}

function getPlace(placeId) {
  return data.places.find((place) => place.id === placeId) || data.places[0];
}

function photosByPlace(placeId) {
  return visiblePhotos().filter((photo) => photo.placeId === placeId);
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
  return visiblePhotos().filter((photo) => {
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
  const journalItems = JOURNAL_SELECTION
    .map((item) => ({ ...item, photo: photoById(item.id) }))
    .filter((item) => item.photo);

  list.innerHTML = journalItems
    .map(
      (item, index) => `
      <article class="journal-entry">
        <img class="reveal-photo" style="--reveal-delay:${index * 60}ms" src="${item.photo.image}" alt="${item.photo.alt}" loading="lazy" />
        <div>
          <small>${placeName(item.photo.placeId)} / ${item.photo.date}</small>
          <h3>${item.title}</h3>
          <p>${item.text}</p>
        </div>
      </article>
    `
    )
    .join("");
}

function renderFilm() {
  const strip = $("#filmStrip");
  if (!strip) return;
  const reels = FILM_REELS.map((reel) => ({
    ...reel,
    photos: reel.ids.map(photoById).filter(Boolean)
  }));

  strip.innerHTML = reels
    .map((reel, reelIndex) => {
      const startNumber = reelIndex * 12;
      return `
        <section class="film-reel-block">
          <div class="film-reel-label">
            <span>${reel.title}</span>
            <small>${reel.photos.length} frames / ${reel.note}</small>
          </div>
          <div class="film-reel" data-reel="${reelIndex}">
            ${reel.photos
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
    const reelPhotos = reels[Number(reel.dataset.reel)]?.photos || visiblePhotos();
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
  const photo = photoById(photoId);
  const lightbox = $("#lightbox");
  if (!photo || !lightbox) return;

  lightboxState.photos = (photoGroup.length ? photoGroup : visiblePhotos()).filter((item) => !EXCLUDED_PHOTO_IDS.has(item.id));
  lightboxState.index = lightboxState.photos.findIndex((item) => item.id === photoId);
  if (lightboxState.index < 0) {
    lightboxState.photos = visiblePhotos();
    lightboxState.index = lightboxState.photos.findIndex((item) => item.id === photoId);
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
