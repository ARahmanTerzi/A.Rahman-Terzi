const STORAGE_KEY = "onlykpi-portal-v1";

const defaultState = {
  settings: {
    companyName: "onlykpi",
    companyDomain: "onlykpi.com",
    periodLabel: "2026 Q2",
  },
  currentUserEmail: "",
  users: [
    {
      id: "admin-1",
      name: "Burcu Aksu",
      email: "burcu.aksu@onlykpi.com",
      role: "admin",
      title: "IK ve Performans Direktoru",
      department: "People & Culture",
    },
    {
      id: "manager-1",
      name: "Ozan Kaya",
      email: "ozan.kaya@onlykpi.com",
      role: "manager",
      title: "Satis Muduru",
      department: "Sales",
    },
    {
      id: "manager-2",
      name: "Elif Arslan",
      email: "elif.arslan@onlykpi.com",
      role: "manager",
      title: "Operasyon Muduru",
      department: "Operations",
    },
  ],
  kpis: [
    {
      id: "kpi-1",
      title: "Ciro hedef gerceklesme",
      description: "Aylik ve ceyreklik satis hedeflerinin yuzdesel gerceklesmesi.",
      category: "Satis",
      weight: 40,
      target: "Ceyrek sonunda hedefin en az %95'i",
    },
    {
      id: "kpi-2",
      title: "Musteri memnuniyeti",
      description: "Anket skoru, sikayet cozme hizi ve yenileme oranlari.",
      category: "Musteri",
      weight: 30,
      target: "CSAT 4.5/5 ve uzeri",
    },
    {
      id: "kpi-3",
      title: "Surec uyumu",
      description: "Politika takibi, SLA uyumu ve raporlama duzeni.",
      category: "Operasyon",
      weight: 30,
      target: "SLA uyumu %98 ve uzeri",
    },
  ],
  evaluations: [
    {
      id: "eval-1",
      employeeName: "Mert Yildirim",
      employeeTitle: "Kidemli Satis Uzmani",
      department: "Sales",
      period: "2026 Q2",
      dueDate: "2026-05-20",
      managerId: "manager-1",
      status: "in_progress",
      summary: "Ana musterilerde buyume bekleniyor.",
      kpiIds: ["kpi-1", "kpi-2"],
      scores: {
        "kpi-1": { score: 4, comment: "Bolgesel hedefin %92'si yakalandi." },
        "kpi-2": { score: 5, comment: "Musteri memnuniyeti hedef ustu." },
      },
      lastUpdated: "2026-04-10T09:30:00.000Z",
    },
    {
      id: "eval-2",
      employeeName: "Ece Demir",
      employeeTitle: "Operasyon Uzmani",
      department: "Operations",
      period: "2026 Q2",
      dueDate: "2026-05-12",
      managerId: "manager-2",
      status: "pending",
      summary: "Surec otomasyonu ve teslim hizi odakta.",
      kpiIds: ["kpi-2", "kpi-3"],
      scores: {},
      lastUpdated: "2026-04-08T15:00:00.000Z",
    },
    {
      id: "eval-3",
      employeeName: "Deniz Akca",
      employeeTitle: "Bolge Satis Yoneticisi",
      department: "Sales",
      period: "2026 Q1",
      dueDate: "2026-03-31",
      managerId: "manager-1",
      status: "completed",
      summary: "Yeni urun lansmani sonrasi yuksek performans.",
      kpiIds: ["kpi-1", "kpi-2", "kpi-3"],
      scores: {
        "kpi-1": { score: 5, comment: "Hedefin %108'i gerceklesti." },
        "kpi-2": { score: 4, comment: "Yenileme oranlari guclu." },
        "kpi-3": { score: 4, comment: "Raporlama duzeni iyilesti." },
      },
      lastUpdated: "2026-03-28T16:45:00.000Z",
    },
  ],
};

const dom = {};
let state = loadState();
let activeUser = null;
let activeView = "overview";
let selectedManagerFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  bootstrap();
});

function cacheDom() {
  dom.loginCard = document.getElementById("loginCard");
  dom.loginForm = document.getElementById("loginForm");
  dom.loginEmail = document.getElementById("loginEmail");
  dom.quickLoginButtons = document.getElementById("quickLoginButtons");
  dom.resetDataButton = document.getElementById("resetDataButton");
  dom.loginMessage = document.getElementById("loginMessage");
  dom.dashboardShell = document.getElementById("dashboardShell");
  dom.sessionGreeting = document.getElementById("sessionGreeting");
  dom.sessionMeta = document.getElementById("sessionMeta");
  dom.logoutButton = document.getElementById("logoutButton");
  dom.sidebarNav = document.getElementById("sidebarNav");
  dom.viewContent = document.getElementById("viewContent");
}

function bootstrap() {
  renderQuickLoginButtons();
  attachGlobalEvents();
  restoreSession();
}

function attachGlobalEvents() {
  dom.loginForm.addEventListener("submit", handleLogin);
  dom.resetDataButton.addEventListener("click", handleResetData);
  dom.logoutButton.addEventListener("click", handleLogout);
  dom.sidebarNav.addEventListener("click", handleViewNavigation);
  dom.viewContent.addEventListener("submit", handleViewSubmit);
  dom.viewContent.addEventListener("click", handleViewClick);
  dom.viewContent.addEventListener("change", handleViewChange);
}

function loadState() {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      settings: {
        ...defaultState.settings,
        ...(parsed.settings || {}),
      },
      users: Array.isArray(parsed.users) ? parsed.users : structuredClone(defaultState.users),
      kpis: Array.isArray(parsed.kpis) ? parsed.kpis : structuredClone(defaultState.kpis),
      evaluations: Array.isArray(parsed.evaluations)
        ? parsed.evaluations
        : structuredClone(defaultState.evaluations),
    };
  } catch (error) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
    return structuredClone(defaultState);
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreSession() {
  if (!state.currentUserEmail) {
    setLoginMessage("Demo hesaplardan biri ile giris yapabilirsiniz.");
    return;
  }

  const user = getUserByEmail(state.currentUserEmail);

  if (!user) {
    state.currentUserEmail = "";
    saveState();
    return;
  }

  activeUser = user;
  activeView = user.role === "admin" ? "overview" : "queue";
  renderApp();
}

function handleLogin(event) {
  event.preventDefault();

  const email = dom.loginEmail.value.trim().toLowerCase();
  const companyDomain = state.settings.companyDomain.toLowerCase();

  if (!email) {
    setLoginMessage("Lutfen e-posta girin.");
    return;
  }

  if (!email.endsWith(`@${companyDomain}`)) {
    setLoginMessage(`Yalnizca @${companyDomain} uzantili sirket mailleri kabul edilir.`);
    return;
  }

  const user = getUserByEmail(email);

  if (!user) {
    setLoginMessage(
      "Bu e-posta sistemde tanimli degil. Admin panelinden manager kullanicisi ekleyin."
    );
    return;
  }

  state.currentUserEmail = user.email;
  saveState();
  activeUser = user;
  activeView = user.role === "admin" ? "overview" : "queue";
  dom.loginForm.reset();
  setLoginMessage("Giris basarili.", true);
  renderApp();
}

function handleResetData() {
  if (!window.confirm("Demo verisi varsayilan hale dondurulsun mu?")) {
    return;
  }

  state = structuredClone(defaultState);
  activeUser = null;
  activeView = "overview";
  selectedManagerFilter = "all";
  saveState();
  renderQuickLoginButtons();
  dom.dashboardShell.classList.add("hidden");
  dom.loginCard.classList.remove("hidden");
  setLoginMessage("Demo verisi sifirlandi. Tekrar giris yapabilirsiniz.", true);
}

function handleLogout() {
  state.currentUserEmail = "";
  saveState();
  activeUser = null;
  activeView = "overview";
  selectedManagerFilter = "all";
  dom.dashboardShell.classList.add("hidden");
  dom.loginCard.classList.remove("hidden");
  setLoginMessage("Oturum kapatildi.", true);
}

function handleViewNavigation(event) {
  const button = event.target.closest("[data-view]");

  if (!button || !activeUser) {
    return;
  }

  const requestedView = button.dataset.view;

  if (!canAccessView(activeUser.role, requestedView)) {
    return;
  }

  activeView = requestedView;
  renderDashboard();
}

function handleViewSubmit(event) {
  const form = event.target.closest("form");

  if (!form || !activeUser) {
    return;
  }

  event.preventDefault();

  switch (form.dataset.formType) {
    case "settings":
      submitSettings(form);
      break;
    case "manager":
      submitManager(form);
      break;
    case "kpi":
      submitKpi(form);
      break;
    case "evaluation":
      submitEvaluation(form);
      break;
    case "score":
      submitScores(form, event);
      break;
    default:
      break;
  }
}

function handleViewClick(event) {
  const button = event.target.closest("[data-action]");

  if (!button || !activeUser) {
    return;
  }

  const { action, id } = button.dataset;

  switch (action) {
    case "delete-manager":
      deleteManager(id);
      break;
    case "delete-kpi":
      deleteKpi(id);
      break;
    case "delete-evaluation":
      deleteEvaluation(id);
      break;
    case "open-evaluation":
      activeView = "queue";
      renderDashboard(id);
      break;
    case "view-history":
      activeView = "history";
      renderDashboard(id);
      break;
    case "edit-evaluation":
      if (activeUser.role === "admin") {
        renderAdminEvaluationDetail(id);
      } else {
        activeView = "queue";
        renderDashboard(id);
      }
      break;
    default:
      break;
  }
}

function handleViewChange(event) {
  const input = event.target;

  if (input.dataset.action !== "manager-filter") {
    return;
  }

  selectedManagerFilter = input.value;
  renderDashboard();
}

function renderQuickLoginButtons() {
  dom.quickLoginButtons.innerHTML = state.users
    .map(
      (user) =>
        `<button class="chip" type="button" data-email="${user.email}">${user.name} (${roleLabel(
          user.role
        )})</button>`
    )
    .join("");

  dom.quickLoginButtons.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      dom.loginEmail.value = button.dataset.email;
      dom.loginForm.requestSubmit();
    });
  });
}

function renderApp() {
  if (!activeUser) {
    return;
  }

  dom.loginCard.classList.add("hidden");
  dom.dashboardShell.classList.remove("hidden");
  dom.sessionGreeting.textContent = `Hos geldiniz, ${activeUser.name}`;
  dom.sessionMeta.textContent = `${roleLabel(activeUser.role)} - ${activeUser.title} - ${
    activeUser.department
  }`;
  renderDashboard();
}

function renderDashboard(focusedEvaluationId) {
  if (!activeUser) {
    return;
  }

  dom.sidebarNav.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("hidden", !canAccessView(activeUser.role, item.dataset.view));
    item.classList.toggle("active", item.dataset.view === activeView);
  });

  switch (activeView) {
    case "overview":
      dom.viewContent.innerHTML = renderOverviewView();
      break;
    case "managers":
      dom.viewContent.innerHTML = renderManagersView();
      break;
    case "kpis":
      dom.viewContent.innerHTML = renderKpisView();
      break;
    case "files":
      dom.viewContent.innerHTML = renderFilesView(focusedEvaluationId);
      break;
    case "queue":
      dom.viewContent.innerHTML = renderQueueView(focusedEvaluationId);
      break;
    case "history":
      dom.viewContent.innerHTML = renderHistoryView(focusedEvaluationId);
      break;
    default:
      dom.viewContent.innerHTML = renderOverviewView();
      break;
  }
}

function renderOverviewView() {
  const managerCount = state.users.filter((user) => user.role === "manager").length;
  const fileCount = state.evaluations.length;
  const completedCount = state.evaluations.filter((item) => item.status === "completed").length;
  const activeCount = state.evaluations.filter((item) => item.status !== "completed").length;
  const overdueCount = state.evaluations.filter(
    (item) => item.status !== "completed" && new Date(item.dueDate) < new Date()
  ).length;

  if (activeUser.role === "admin") {
    return `
      <section class="view-section">
        <div class="card-grid metrics">
          ${renderStatCard("Manager", managerCount, "Tanimli degerlendirici hesap sayisi")}
          ${renderStatCard("KPI", state.kpis.length, "Admin tarafinda yonetilen aktif KPI")}
          ${renderStatCard("Personel dosyasi", fileCount, "Toplam degerlendirme dosyasi")}
          ${renderStatCard("Tamamlanan", completedCount, `Bekleyen veya aktif: ${activeCount}`)}
        </div>

        ${overdueCount ? `<div class="notice error">${overdueCount} dosya son tarihi gecti.</div>` : ""}

        <div class="two-column">
          <article class="panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">Sirket ayarlari</span>
                <h3>Giris ve donem parametreleri</h3>
              </div>
            </div>

            <form class="settings-form" data-form-type="settings">
              <label>
                <span>Sirket adi</span>
                <input name="companyName" value="${escapeHtml(state.settings.companyName)}" required />
              </label>

              <label>
                <span>Sirket domaini</span>
                <input name="companyDomain" value="${escapeHtml(
                  state.settings.companyDomain
                )}" required />
              </label>

              <label>
                <span>Varsayilan donem etiketi</span>
                <input name="periodLabel" value="${escapeHtml(state.settings.periodLabel)}" required />
              </label>

              <button class="button primary" type="submit">Ayarlari kaydet</button>
            </form>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">Yonetici ozeti</span>
                <h3>Son degerlendirme hareketleri</h3>
              </div>
            </div>

            <div class="timeline">
              ${renderTimelineItems(
                state.evaluations
                  .slice()
                  .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
                  .slice(0, 5)
              )}
            </div>
          </article>
        </div>
      </section>
    `;
  }

  const queue = getManagerEvaluations(activeUser.id, ["pending", "in_progress"]);
  const completed = getManagerEvaluations(activeUser.id, ["completed"]);
  const averageScore = completed.length
    ? (
        completed.reduce((total, item) => total + calculateEvaluationScore(item), 0) / completed.length
      ).toFixed(1)
    : "0.0";

  return `
    <section class="view-section">
      <div class="card-grid metrics">
        ${renderStatCard("Aktif dosya", queue.length, "Size atanan degerlendirmeler")}
        ${renderStatCard("Tamamlanan", completed.length, "Bu donemde bitirdiginiz dosyalar")}
        ${renderStatCard("Ort. skor", averageScore, "Tamamlanan dosyalarda ortalama sonuc")}
        ${renderStatCard("KPI havuzu", state.kpis.length, "Admin tarafinda tanimlanan KPI sayisi")}
      </div>

      <div class="two-column">
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Siradaki isler</span>
              <h3>Degerlendirme kuyrugunuz</h3>
            </div>
          </div>
          ${
            queue.length
              ? queue
                  .map(
                    (item) => `
                      <div class="list-item">
                        <div class="list-item-head">
                          <div>
                            <strong>${escapeHtml(item.employeeName)}</strong>
                            <p class="meta">${escapeHtml(item.employeeTitle)} - ${escapeHtml(
                              item.department
                            )}</p>
                          </div>
                          ${renderStatusPill(item.status)}
                        </div>
                        <p class="meta">Donem: ${escapeHtml(item.period)} | Son tarih: ${formatDate(
                          item.dueDate
                        )}</p>
                        <button class="button subtle" type="button" data-action="open-evaluation" data-id="${
                          item.id
                        }">Degerlendirmeyi ac</button>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="empty-state">Size atanan aktif dosya bulunmuyor.</div>`
          }
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Beklenti</span>
              <h3>Manager kullanimi</h3>
            </div>
          </div>
          <div class="stack-list">
            <div class="notice info">Yeni KPI ekleyemezsiniz; KPI'lar sadece admin tarafinda tanimlanir.</div>
            <div class="notice info">Her dosya icin taslak kaydedebilir, sonra tamamlanan duruma cekebilirsiniz.</div>
            <div class="notice info">Skorlar KPI agirligina gore otomatik genel puana donusturulur.</div>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderManagersView() {
  const managers = state.users.filter((user) => user.role === "manager");

  return `
    <section class="view-section">
      <div class="two-column">
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Kullanici yonetimi</span>
              <h3>Yeni manager ekle</h3>
            </div>
          </div>

          <form class="stacked-form" data-form-type="manager">
            <label>
              <span>Ad soyad</span>
              <input name="name" required />
            </label>
            <div class="field-grid">
              <label>
                <span>E-posta</span>
                <input type="email" name="email" placeholder="ad.soyad@${
                  state.settings.companyDomain
                }" required />
              </label>
              <label>
                <span>Departman</span>
                <input name="department" required />
              </label>
            </div>
            <label>
              <span>Unvan</span>
              <input name="title" required />
            </label>
            <button class="button primary" type="submit">Manager kullanicisi ekle</button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Tanimli manager'lar</span>
              <h3>Login yetkisi olan kullanicilar</h3>
            </div>
          </div>

          <div class="stack-list">
            ${
              managers.length
                ? managers
                    .map(
                      (manager) => `
                        <div class="list-item">
                          <div class="list-item-head">
                            <div>
                              <strong>${escapeHtml(manager.name)}</strong>
                              <p class="meta">${escapeHtml(manager.title)} - ${escapeHtml(
                                manager.department
                              )}</p>
                            </div>
                            <button class="button ghost" type="button" data-action="delete-manager" data-id="${
                              manager.id
                            }">Sil</button>
                          </div>
                          <span class="badge">${escapeHtml(manager.email)}</span>
                        </div>
                      `
                    )
                    .join("")
                : `<div class="empty-state">Henuz manager tanimlanmadi.</div>`
            }
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderKpisView() {
  return `
    <section class="view-section">
      <div class="two-column">
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Admin yetkisi</span>
              <h3>Yeni KPI tanimi</h3>
            </div>
          </div>

          <form class="stacked-form" data-form-type="kpi">
            <label>
              <span>KPI basligi</span>
              <input name="title" required />
            </label>
            <div class="field-grid">
              <label>
                <span>Kategori</span>
                <input name="category" required />
              </label>
              <label>
                <span>Agirlik (%)</span>
                <input type="number" name="weight" min="1" max="100" required />
              </label>
            </div>
            <label>
              <span>Hedef tanimi</span>
              <input name="target" required />
            </label>
            <label>
              <span>Aciklama</span>
              <textarea name="description" required></textarea>
            </label>
            <button class="button primary" type="submit">KPI kaydet</button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Aktif KPI havuzu</span>
              <h3>Tum tanimlar</h3>
            </div>
          </div>

          <div class="stack-list">
            ${
              state.kpis.length
                ? state.kpis
                    .map(
                      (kpi) => `
                        <div class="list-item">
                          <div class="list-item-head">
                            <div>
                              <strong>${escapeHtml(kpi.title)}</strong>
                              <p class="meta">${escapeHtml(kpi.category)} | Agirlik: ${kpi.weight}%</p>
                            </div>
                            <button class="button ghost" type="button" data-action="delete-kpi" data-id="${
                              kpi.id
                            }">Sil</button>
                          </div>
                          <p>${escapeHtml(kpi.description)}</p>
                          <span class="badge">Hedef: ${escapeHtml(kpi.target)}</span>
                        </div>
                      `
                    )
                    .join("")
                : `<div class="empty-state">Henuz KPI tanimi bulunmuyor.</div>`
            }
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderFilesView(focusedEvaluationId) {
  const managers = state.users.filter((user) => user.role === "manager");
  const selectedManagerId = selectedManagerFilter;
  const focusedEvaluation = state.evaluations.find((item) => item.id === focusedEvaluationId) || null;
  const evaluationRows = state.evaluations
    .filter((item) => selectedManagerId === "all" || item.managerId === selectedManagerId)
    .map((item) => renderEvaluationRow(item, focusedEvaluationId))
    .join("");

  return `
    <section class="view-section">
      <div class="split-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Dosya yonlendirme</span>
              <h3>Manager'a personel dosyasi ata</h3>
            </div>
          </div>

          <form class="stacked-form" data-form-type="evaluation">
            <div class="field-grid">
              <label>
                <span>Personel adi</span>
                <input name="employeeName" required />
              </label>
              <label>
                <span>Unvan</span>
                <input name="employeeTitle" required />
              </label>
            </div>

            <div class="field-grid">
              <label>
                <span>Departman</span>
                <input name="department" required />
              </label>
              <label>
                <span>Donem</span>
                <input name="period" value="${escapeHtml(state.settings.periodLabel)}" required />
              </label>
            </div>

            <div class="field-grid">
              <label>
                <span>Manager</span>
                <select name="managerId" required>
                  <option value="">Secin</option>
                  ${managers
                    .map(
                      (manager) =>
                        `<option value="${manager.id}">${escapeHtml(manager.name)} - ${escapeHtml(
                          manager.department
                        )}</option>`
                    )
                    .join("")}
                </select>
              </label>
              <label>
                <span>Son tarih</span>
                <input type="date" name="dueDate" required />
              </label>
            </div>

            <label>
              <span>Degerlendirme notu</span>
              <textarea name="summary" required></textarea>
            </label>

            <div>
              <span class="input-label">Dosyaya eklenecek KPI'lar</span>
              <div class="kpi-checklist">
                ${
                  state.kpis.length
                    ? state.kpis
                        .map(
                          (kpi) => `
                            <label class="checkbox-card">
                              <input type="checkbox" name="kpiIds" value="${kpi.id}" />
                              <div>
                                <strong>${escapeHtml(kpi.title)}</strong>
                                <p class="meta">${escapeHtml(kpi.target)} | Agirlik: ${kpi.weight}%</p>
                              </div>
                            </label>
                          `
                        )
                        .join("")
                    : `<div class="empty-state">Once KPI tanimi olusturun.</div>`
                }
              </div>
            </div>

            <button class="button primary" type="submit">Dosyayi manager'a gonder</button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Dosya listesi</span>
              <h3>Atanmis personel degerlendirmeleri</h3>
            </div>
            <label>
              <span>Manager filtrele</span>
              <select data-action="manager-filter">
                <option value="all">Tum manager'lar</option>
                ${managers
                  .map(
                    (manager) =>
                      `<option value="${manager.id}" ${
                        selectedManagerId === manager.id ? "selected" : ""
                      }>${escapeHtml(manager.name)}</option>`
                  )
                  .join("")}
              </select>
            </label>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Personel</th>
                  <th>Manager</th>
                  <th>Durum</th>
                  <th>Son tarih</th>
                  <th>Skor</th>
                  <th>Islem</th>
                </tr>
              </thead>
              <tbody>
                ${
                  evaluationRows ||
                  `<tr><td colspan="6"><div class="empty-state">Henuz dosya olusturulmadi.</div></td></tr>`
                }
              </tbody>
            </table>
          </div>

          ${
            focusedEvaluation
              ? `
                <div class="stack-list">
                  <div class="notice info">
                    <strong>${escapeHtml(focusedEvaluation.employeeName)}</strong> dosyasi secildi.
                    Genel skor: ${calculateEvaluationScore(focusedEvaluation)}/5
                  </div>
                  <div class="score-grid">
                    ${focusedEvaluation.kpiIds
                      .map((kpiId) => {
                        const kpi = getKpiById(kpiId);
                        const scoreData = focusedEvaluation.scores[kpiId] || {
                          score: "-",
                          comment: "Henuz manager yorumu yok.",
                        };

                        return `
                          <div class="score-card">
                            <div class="score-card-header">
                              <div>
                                <strong>${escapeHtml(kpi?.title || "KPI")}</strong>
                                <p class="meta">${escapeHtml(kpi?.target || "")}</p>
                              </div>
                              <span class="badge">Puan: ${scoreData.score}</span>
                            </div>
                            <p>${escapeHtml(scoreData.comment)}</p>
                          </div>
                        `;
                      })
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
        </article>
      </div>
    </section>
  `;
}

function renderQueueView(focusedEvaluationId) {
  const queue = getManagerEvaluations(activeUser.id, ["pending", "in_progress"]);
  const selected = queue.find((item) => item.id === focusedEvaluationId) || queue[0];

  return `
    <section class="view-section">
      <div class="split-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Aktif kuyruk</span>
              <h3>Atanan personel dosyalari</h3>
            </div>
          </div>

          <div class="stack-list">
            ${
              queue.length
                ? queue
                    .map(
                      (item) => `
                        <div class="list-item">
                          <div class="list-item-head">
                            <div>
                              <strong>${escapeHtml(item.employeeName)}</strong>
                              <p class="meta">${escapeHtml(item.employeeTitle)} - ${escapeHtml(
                                item.department
                              )}</p>
                            </div>
                            ${renderStatusPill(item.status)}
                          </div>
                          <p class="meta">Son tarih: ${formatDate(item.dueDate)}</p>
                          <button class="button subtle" type="button" data-action="edit-evaluation" data-id="${
                            item.id
                          }">Dosyayi sec</button>
                        </div>
                      `
                    )
                    .join("")
                : `<div class="empty-state">Aktif degerlendirme bulunmuyor.</div>`
            }
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Puanlama formu</span>
              <h3>${selected ? escapeHtml(selected.employeeName) : "Degerlendirme secin"}</h3>
            </div>
          </div>

          ${
            selected
              ? renderScoreForm(selected)
              : `<div class="empty-state">Detaylarini gormek icin soldan bir dosya secin.</div>`
          }
        </article>
      </div>
    </section>
  `;
}

function renderHistoryView(focusedEvaluationId) {
  const completed = getManagerEvaluations(activeUser.id, ["completed"]);
  const selected = completed.find((item) => item.id === focusedEvaluationId) || completed[0];

  return `
    <section class="view-section">
      <div class="split-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Arsiv</span>
              <h3>Tamamlanan degerlendirmeler</h3>
            </div>
          </div>

          <div class="stack-list">
            ${
              completed.length
                ? completed
                    .map(
                      (item) => `
                        <div class="list-item">
                          <div class="list-item-head">
                            <div>
                              <strong>${escapeHtml(item.employeeName)}</strong>
                              <p class="meta">${escapeHtml(item.period)} - Genel skor ${calculateEvaluationScore(
                                item
                              )}/5</p>
                            </div>
                            ${renderStatusPill(item.status)}
                          </div>
                          <button class="button subtle" type="button" data-action="view-history" data-id="${
                            item.id
                          }">Detayi gor</button>
                        </div>
                      `
                    )
                    .join("")
                : `<div class="empty-state">Tamamlanmis dosya bulunmuyor.</div>`
            }
          </div>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">Sonuc ozeti</span>
              <h3>${selected ? escapeHtml(selected.employeeName) : "Detay bulunmuyor"}</h3>
            </div>
          </div>

          ${
            selected
              ? `
                <div class="stack-list">
                  <div class="list-item">
                    <strong>Genel skor</strong>
                    <p class="meta">${calculateEvaluationScore(selected)}/5 | Son guncelleme: ${formatDateTime(
                      selected.lastUpdated
                    )}</p>
                  </div>
                  ${selected.kpiIds
                    .map((kpiId) => {
                      const kpi = getKpiById(kpiId);
                      const scoreData = selected.scores[kpiId] || { score: "-", comment: "Yorum yok" };

                      return `
                        <div class="score-card">
                          <div class="score-card-header">
                            <div>
                              <strong>${escapeHtml(kpi?.title || "KPI")}</strong>
                              <p class="meta">${escapeHtml(kpi?.target || "")}</p>
                            </div>
                            <span class="badge">Puan: ${scoreData.score}</span>
                          </div>
                          <p>${escapeHtml(scoreData.comment || "Yorum yok")}</p>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              `
              : `<div class="empty-state">Detay gormek icin soldan kayit secin.</div>`
          }
        </article>
      </div>
    </section>
  `;
}

function renderScoreForm(evaluation) {
  const assignedManager = getUserById(evaluation.managerId);
  const scoreAverage = calculateEvaluationScore(evaluation);

  return `
    <form class="stacked-form" data-form-type="score" data-evaluation-id="${evaluation.id}">
      <div class="list-item">
        <div class="list-item-head">
          <div>
            <strong>${escapeHtml(evaluation.employeeTitle)} - ${escapeHtml(evaluation.department)}</strong>
            <p class="meta">Manager: ${escapeHtml(assignedManager?.name || "")} | Donem: ${escapeHtml(
              evaluation.period
            )}</p>
          </div>
          ${renderStatusPill(evaluation.status)}
        </div>
        <p>${escapeHtml(evaluation.summary)}</p>
        <div class="progress-row">
          <strong>${scoreAverage}/5</strong>
          <div class="progress-bar"><span style="width: ${scoreAverage * 20}%"></span></div>
        </div>
      </div>

      <div class="score-grid">
        ${evaluation.kpiIds
          .map((kpiId) => {
            const kpi = getKpiById(kpiId);
            const scoreData = evaluation.scores[kpiId] || { score: "", comment: "" };

            return `
              <div class="score-card">
                <div class="score-card-header">
                  <div>
                    <strong>${escapeHtml(kpi?.title || "KPI")}</strong>
                    <p class="meta">${escapeHtml(kpi?.description || "")}</p>
                  </div>
                  <span class="badge">${kpi?.weight || 0}% agirlik</span>
                </div>

                <label>
                  <span>Puan (1-5)</span>
                  <select class="score-select" name="score-${kpiId}" required>
                    <option value="">Secin</option>
                    ${[1, 2, 3, 4, 5]
                      .map(
                        (value) =>
                          `<option value="${value}" ${
                            Number(scoreData.score) === value ? "selected" : ""
                          }>${value}</option>`
                      )
                      .join("")}
                  </select>
                </label>

                <label>
                  <span>Yorum</span>
                  <textarea name="comment-${kpiId}" required>${escapeHtml(
                    scoreData.comment || ""
                  )}</textarea>
                </label>
              </div>
            `;
          })
          .join("")}
      </div>

      <div class="topbar-actions">
        <button class="button ghost" type="submit" name="saveMode" value="draft">Taslak kaydet</button>
        <button class="button primary" type="submit" name="saveMode" value="complete">Tamamla</button>
      </div>
    </form>
  `;
}

function renderEvaluationRow(item, focusedEvaluationId) {
  const manager = getUserById(item.managerId);
  const isFocused = focusedEvaluationId === item.id;

  return `
    <tr${isFocused ? ` class="is-focused"` : ""}>
      <td>
        <strong>${escapeHtml(item.employeeName)}</strong><br />
        <span class="meta">${escapeHtml(item.employeeTitle)}</span>
      </td>
      <td>${escapeHtml(manager?.name || "-")}</td>
      <td>${renderStatusPill(item.status)}</td>
      <td>${formatDate(item.dueDate)}</td>
      <td>${calculateEvaluationScore(item)}/5</td>
      <td>
        <div class="topbar-actions">
          <button class="button subtle" type="button" data-action="edit-evaluation" data-id="${item.id}">
            Incele
          </button>
          <button class="button ghost" type="button" data-action="delete-evaluation" data-id="${item.id}">
            Sil
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderTimelineItems(items) {
  if (!items.length) {
    return `<div class="empty-state">Hareket bulunmuyor.</div>`;
  }

  return items
    .map((item) => {
      const manager = getUserById(item.managerId);
      return `
        <div class="timeline-item">
          <span class="timeline-dot" aria-hidden="true"></span>
          <div>
            <strong>${escapeHtml(item.employeeName)}</strong>
            <p class="meta">${renderStatusText(item.status)} - ${escapeHtml(
              manager?.name || "Atanmadi"
            )} - ${formatDateTime(item.lastUpdated)}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderStatCard(label, value, caption) {
  return `
    <article class="stat-card">
      <span class="label">${label}</span>
      <strong>${value}</strong>
      <small>${caption}</small>
    </article>
  `;
}

function submitSettings(form) {
  const formData = new FormData(form);

  state.settings = {
    companyName: String(formData.get("companyName")).trim(),
    companyDomain: normalizeDomain(String(formData.get("companyDomain")).trim()),
    periodLabel: String(formData.get("periodLabel")).trim(),
  };

  saveState();
  renderQuickLoginButtons();
  renderDashboard();
}

function submitManager(form) {
  const formData = new FormData(form);
  const email = String(formData.get("email")).trim().toLowerCase();

  if (!email.endsWith(`@${state.settings.companyDomain}`)) {
    window.alert(`Manager maili @${state.settings.companyDomain} uzantili olmalidir.`);
    return;
  }

  if (getUserByEmail(email)) {
    window.alert("Bu e-posta zaten tanimli.");
    return;
  }

  state.users.push({
    id: createId("manager"),
    name: String(formData.get("name")).trim(),
    email,
    role: "manager",
    title: String(formData.get("title")).trim(),
    department: String(formData.get("department")).trim(),
  });

  saveState();
  renderQuickLoginButtons();
  form.reset();
  renderDashboard();
}

function submitKpi(form) {
  const formData = new FormData(form);
  const weight = Number(formData.get("weight"));

  if (Number.isNaN(weight) || weight < 1 || weight > 100) {
    window.alert("Agirlik 1 ile 100 arasinda olmalidir.");
    return;
  }

  state.kpis.push({
    id: createId("kpi"),
    title: String(formData.get("title")).trim(),
    category: String(formData.get("category")).trim(),
    weight,
    target: String(formData.get("target")).trim(),
    description: String(formData.get("description")).trim(),
  });

  saveState();
  form.reset();
  renderDashboard();
}

function submitEvaluation(form) {
  if (!state.kpis.length) {
    window.alert("Once en az bir KPI tanimlayin.");
    return;
  }

  const formData = new FormData(form);
  const kpiIds = formData.getAll("kpiIds").map(String);

  if (!kpiIds.length) {
    window.alert("En az bir KPI secmelisiniz.");
    return;
  }

  state.evaluations.unshift({
    id: createId("eval"),
    employeeName: String(formData.get("employeeName")).trim(),
    employeeTitle: String(formData.get("employeeTitle")).trim(),
    department: String(formData.get("department")).trim(),
    period: String(formData.get("period")).trim(),
    dueDate: String(formData.get("dueDate")).trim(),
    managerId: String(formData.get("managerId")),
    status: "pending",
    summary: String(formData.get("summary")).trim(),
    kpiIds,
    scores: {},
    lastUpdated: new Date().toISOString(),
  });

  saveState();
  form.reset();
  renderDashboard();
}

function submitScores(form, submitEvent) {
  const evaluationId = form.dataset.evaluationId;
  const evaluation = state.evaluations.find((item) => item.id === evaluationId);

  if (!evaluation) {
    return;
  }

  const formData = new FormData(form);
  const submitter = submitEvent.submitter;
  const saveMode = submitter?.value || "draft";

  const nextScores = {};

  for (const kpiId of evaluation.kpiIds) {
    const score = Number(formData.get(`score-${kpiId}`));
    const comment = String(formData.get(`comment-${kpiId}`)).trim();

    if (!score || !comment) {
      window.alert("Tum KPI alanlarini doldurmalisiniz.");
      return;
    }

    nextScores[kpiId] = { score, comment };
  }

  evaluation.scores = nextScores;
  evaluation.status = saveMode === "complete" ? "completed" : "in_progress";
  evaluation.lastUpdated = new Date().toISOString();

  saveState();
  activeView = saveMode === "complete" ? "history" : "queue";
  renderDashboard(evaluation.id);
}

function deleteManager(managerId) {
  const hasAssignedFiles = state.evaluations.some((item) => item.managerId === managerId);

  if (hasAssignedFiles) {
    window.alert("Bu manager'a atanmis dosyalar var. Once dosyalari tasiyin veya silin.");
    return;
  }

  state.users = state.users.filter((user) => user.id !== managerId);
  saveState();
  renderQuickLoginButtons();
  renderDashboard();
}

function deleteKpi(kpiId) {
  const isUsed = state.evaluations.some((item) => item.kpiIds.includes(kpiId));

  if (isUsed) {
    window.alert("Bu KPI aktif dosyalarda kullaniliyor, once ilgili dosyalari temizleyin.");
    return;
  }

  state.kpis = state.kpis.filter((kpi) => kpi.id !== kpiId);
  saveState();
  renderDashboard();
}

function deleteEvaluation(evaluationId) {
  state.evaluations = state.evaluations.filter((item) => item.id !== evaluationId);
  saveState();
  renderDashboard();
}

function renderAdminEvaluationDetail(evaluationId) {
  activeView = "files";
  const evaluation = state.evaluations.find((item) => item.id === evaluationId);

  if (evaluation) {
    selectedManagerFilter = evaluation.managerId;
  }

  renderDashboard(evaluationId);
}

function calculateEvaluationScore(evaluation) {
  if (!evaluation || !evaluation.kpiIds.length) {
    return 0;
  }

  let totalWeight = 0;
  let weightedScore = 0;

  evaluation.kpiIds.forEach((kpiId) => {
    const kpi = getKpiById(kpiId);
    const score = Number(evaluation.scores[kpiId]?.score || 0);
    const weight = Number(kpi?.weight || 0);

    totalWeight += weight;
    weightedScore += score * weight;
  });

  if (!totalWeight) {
    return 0;
  }

  return (weightedScore / totalWeight).toFixed(1);
}

function getManagerEvaluations(managerId, statuses) {
  return state.evaluations
    .filter((item) => item.managerId === managerId && statuses.includes(item.status))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function canAccessView(role, view) {
  const accessMap = {
    admin: ["overview", "managers", "kpis", "files"],
    manager: ["overview", "queue", "history"],
  };

  return accessMap[role]?.includes(view);
}

function getUserByEmail(email) {
  return state.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  return state.users.find((user) => user.id === id);
}

function getKpiById(id) {
  return state.kpis.find((kpi) => kpi.id === id);
}

function setLoginMessage(message, isSuccess = false) {
  dom.loginMessage.textContent = message;
  dom.loginMessage.classList.toggle("success", isSuccess);
}

function roleLabel(role) {
  return role === "admin" ? "Admin" : "Manager";
}

function renderStatusText(status) {
  const labels = {
    pending: "Beklemede",
    in_progress: "Devam ediyor",
    completed: "Tamamlandi",
  };

  return labels[status] || status;
}

function renderStatusPill(status) {
  return `<span class="status-pill ${status}">${renderStatusText(status)}</span>`;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeDomain(value) {
  return value.replace(/^@/, "").toLowerCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
