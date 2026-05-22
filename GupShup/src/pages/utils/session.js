export function persistSession(authPayload) {
  const { accessToken, refreshToken, user } = authPayload;

  localStorage.setItem("token", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("userEmail", user.email || "");
  localStorage.setItem("displayName", user.name || "");
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("userRole", user.role || "user");

  if (user.username) {
    localStorage.setItem("personalUsername", user.username);
  } else {
    localStorage.removeItem("personalUsername");
  }

  if (user.age) {
    localStorage.setItem("age", String(user.age));
  } else {
    localStorage.removeItem("age");
  }

  if (user.birthDate) {
    const label = new Date(user.birthDate).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    localStorage.setItem("userBirthDate", label);
  } else {
    localStorage.removeItem("userBirthDate");
  }

  localStorage.setItem("userPhone", user.phone || "");
  localStorage.setItem("userGender", user.gender || "Not set");
  localStorage.setItem("userCountry", user.country || "India");
  localStorage.setItem("userLanguages", user.languages || "English, Hindi");
}

export function clearSession() {
  [
    "token",
    "refreshToken",
    "isAdminAuthenticated",
    "user",
    "userEmail",
    "displayName",
    "age",
    "personalUsername",
    "userBirthDate",
    "userPhone",
    "userGender",
    "userCountry",
    "userLanguages",
    "userRole",
  ].forEach((key) => localStorage.removeItem(key));
}
