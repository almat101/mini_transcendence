import { navigateTo } from "../router.js";
import { userService } from "../services/userService.js";

export function Navbar() {
  const userData = userService.getUserData();
  const navbar = document.createElement("nav");
  navbar.className = "navbar navbar-expand-lg bg-body-tertiary";

  const container = document.createElement("div");
  container.className = "container-fluid";

  //toggler
  const toggler = document.createElement("button");
  toggler.className = "navbar-toggler d-lg-none";
  toggler.type = "button";
  toggler.setAttribute("data-bs-toggle", "offcanvas");
  toggler.setAttribute("data-bs-target", "#offcanvasNavbar");
  toggler.setAttribute("aria-controls", "offcanvasNavbar");
  toggler.setAttribute("aria-label", "Toggle navigation");

  const togglerIcon = document.createElement("span");
  togglerIcon.className = "navbar-toggler-icon";
  toggler.appendChild(togglerIcon);

  container.appendChild(toggler);

  const collapse = document.createElement("div");
  collapse.className = "offcanvas offcanvas-end d-lg-none";
  collapse.id = "offcanvasNavbar";
  collapse.tabIndex = -1;
  collapse.setAttribute("aria-labelledby", "offcanvasNavbarLabel");

  const toggleHeader = document.createElement("div");
  toggleHeader.className = "offcanvas-header";

  const toggleTitle = document.createElement("h5");
  toggleTitle.className = "offcanvas-title";
  toggleTitle.id = "offcanvasNavbarLabel";
  toggleTitle.textContent = "Menu";

  const toggleClose = document.createElement("button");
  toggleClose.className = "btn-close text-reset";
  toggleClose.type = "button";
  toggleClose.setAttribute("data-bs-dismiss", "offcanvas");
  toggleClose.setAttribute("aria-label", "Close");

  toggleHeader.appendChild(toggleTitle);
  toggleHeader.appendChild(toggleClose);

  collapse.appendChild(toggleHeader);

  const togglerBody = document.createElement("div");
  togglerBody.className = "offcanvas-body d-flex flex-column";

  const togglerList = document.createElement("ul");
  togglerList.className = "navbar-nav justify-content-center flex-grow-0 w-100";

  // { name: "Home", route: "/" },
  const links = [
    { name: "Pong", route: "/" },
    { name: "Friends", route: "/friends" },
    { name: "Profile ", route: "/profile"}
  ];

  const menuItems = [
    { name: "Settings", route: "/settings", icon: "gear" },
    { name: "Logout", className: "text-danger", route: "/logout", icon: "box-arrow-in-right" },
  ];


  links.forEach((link) => {
    const listItem = document.createElement("li");
    listItem.className = "nav-item toggler-nav-item";

    const anchor = document.createElement("a");
    anchor.id = "togglerList";
    anchor.className = "nav-link";
    anchor.textContent = link.name;
    anchor.href = link.route;

    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      navigateTo(link.route);
    });

    listItem.appendChild(anchor);
    togglerList.appendChild(listItem);
  });

  togglerBody.appendChild(togglerList);

  const collapseFooter = document.createElement("div");
  collapseFooter.className = "offcanvas-footer mt-auto";

  const collapseFooterList = document.createElement("ul");
  collapseFooterList.className = "navbar-nav";

  menuItems.forEach((link) => {
    const listItem = document.createElement("li");
    listItem.className = "nav-item footer-nav-item";

    const anchor = document.createElement("a");
    anchor.className = `nav-link footer-nav-link ${link.className || ""}`;
    anchor.textContent = link.name;
    anchor.href = link.route;

    anchor.addEventListener("click", (event) => {
      event.preventDefault();
        navigateTo(link.route);
    });

    listItem.appendChild(anchor);
    collapseFooterList.appendChild(listItem);
  });

  collapseFooter.appendChild(collapseFooterList);
  togglerBody.appendChild(collapseFooter);

  collapse.appendChild(togglerBody);
  container.appendChild(collapse);

  //nav bar

  const nav = document.createElement("ul");
  nav.className = "navbar-nav d-none d-lg-flex align-items-center w-100";

  const leftNav = document.createElement("div");
  leftNav.className = "nav-left";

  const centerNav = document.createElement("div");
  centerNav.className = "nav-center";

  links.forEach((link) => {
    const listItem = document.createElement("li");
    listItem.className = "nav-item";

    const anchor = document.createElement("a");
    anchor.className = "nav-link";
    anchor.textContent = link.name;
    anchor.href = link.route;

    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      navigateTo(link.route);
    });

    listItem.appendChild(anchor);
    centerNav.appendChild(listItem);
  });

  const avatarDropdown = document.createElement("div");
  avatarDropdown.className = "dropdown d-none d-lg-block";

  const avatarButton = document.createElement("button");
  avatarButton.className = "btn btn-link p-0";
  avatarButton.style.border = "none";
  avatarButton.type = "button";
  avatarButton.setAttribute("data-bs-toggle", "dropdown");
  avatarButton.setAttribute("aria-expanded", "false");

  const avatarContainer = document.createElement("div");
  avatarContainer.className = "avatar-container";

  const avatar = document.createElement("img");
  avatar.className = "avatar-circle";
  avatar.src = userData.avatar;
  avatar.style.width = "40px";
  avatar.style.height = "40px";
  avatar.style.borderRadius = "50%";
  avatar.style.objectFit = "cover";
  avatar.style.cursor = "pointer";

  const avatarTextContainer = document.createElement("div");
  avatarTextContainer.className = "avatar-text";
  avatarTextContainer.textContent = "Me";

  const arrowIcon = document.createElement("i");
  arrowIcon.className = "bi bi-chevron-down";
  avatarTextContainer.appendChild(arrowIcon);

  avatarContainer.appendChild(avatar);
  avatarContainer.appendChild(avatarTextContainer);

  const dropdownMenu = document.createElement("ul");
  dropdownMenu.className = "dropdown-menu dropdown-menu-start";

  menuItems.forEach(item => {
    const menuItem = document.createElement("li");

    const menuLink = document.createElement("a");
    menuLink.className = `dropdown-item ${item.className || ""}`;
    menuLink.href = item.route;
    menuLink.textContent = item.name;

    const icon = document.createElement("i");
    icon.className = `bi bi-${item.icon}`;

    menuLink.appendChild(icon);

    menuLink.addEventListener("click", (e) => {
      e.preventDefault();
        navigateTo(item.route);
    });

    menuItem.appendChild(menuLink);
    dropdownMenu.appendChild(menuItem);
  });

  const themeTogglerli = document.createElement("li");
  const themeToggler = document.createElement("button");
  themeToggler.className = "dropdown-item";
  themeToggler.innerHTML = `<i class="bi bi-sun-fill theme-icon-active" data-theme-icon-active></i>`;
  themeToggler.addEventListener("click", () => {
      const theme = document.documentElement.getAttribute('data-bs-theme');
      const newTheme = theme === 'light' ? 'dark' : 'light';
      window.setTheme(newTheme);
      updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
      const icon = themeToggler.querySelector('i');
      icon.className = theme === 'light' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
  }

  updateThemeIcon(document.documentElement.getAttribute('data-bs-theme'));

  themeTogglerli.appendChild(themeToggler);
  dropdownMenu.appendChild(themeTogglerli);


  avatarButton.appendChild(avatarContainer);
  avatarDropdown.appendChild(avatarButton);
  avatarDropdown.appendChild(dropdownMenu);
  leftNav.appendChild(avatarDropdown);

  const rightNav = document.createElement("div");
  rightNav.className = "d-flex align-items-center";

  nav.appendChild(leftNav);
  nav.appendChild(centerNav);
  nav.appendChild(rightNav);

  container.appendChild(nav);
  navbar.appendChild(container);

  return navbar;
}
