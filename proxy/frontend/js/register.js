import { registerRoute, loadPage } from "./router.js";
import { renderLoginPage } from "./pages/login.js";
import { renderSignupPage } from "./pages/signup.js";
import { renderFriendsPage } from "./pages/friends.js";
import { renderPongPage } from "./pages/pong.js";
import { renderSettingsPage } from "./pages/settings.js";
import { renderLogoutPage } from "./pages/logout.js";
import { renderPageNotFound } from "./pages/404.js";
import { tokenService } from "./services/authService.js";
import { authService } from "./services/authService.js";
import { userService } from "./services/userService.js";
import { renderProfilePage } from "./pages/profile.js";

// Register routes
registerRoute("/", renderPongPage);
registerRoute("/login", renderLoginPage);
registerRoute("/signup", renderSignupPage);
registerRoute("/friends", renderFriendsPage);
registerRoute("/404", renderPageNotFound);
registerRoute("/settings", renderSettingsPage);
registerRoute("/logout", renderLogoutPage);
registerRoute("/profile", renderProfilePage);


if (tokenService.getAccessToken() && !userService.hasUserData()) {
    authService.fetchAndStoreUserData();
}

loadPage(window.location.pathname);
