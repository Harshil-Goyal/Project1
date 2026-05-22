export const NAV_ITEMS = ["Home", "Explore", "Notifications", "Bookmarks", "Chat", "Profile", "Settings"];

export const SETTINGS_ITEMS = [
  "Your account",
  "Privacy and safety",
  "Notifications",
  "Accessibility",
  "Help center",
];

export const ACCOUNT_ITEMS = [
  "Account information",
  "Change password",
  "Archive your data",
  "Deactivate account",
];

export const SETTINGS_CATEGORIES = [
  "Account Information",
  "Password and security",
  "Account privacy",
  "Notifications",
  "Accessibility and display",
  "Additional resources",
  "Help Center",
];

export const ACCOUNT_DETAILS = [
  { title: "Account information", subtitle: "See your phone number and email address." },
  { title: "Change your password", subtitle: "Change your password at any time." },
  { title: "Download an archive of your data", subtitle: "Get insights into the data stored for your account." },
  { title: "Deactivate your account", subtitle: "Find out how you can deactivate your account." },
];

export const FEED_POSTS = [
  {
    id: "p1",
    author: "Global Brief",
    handle: "@globalbrief",
    ageMinutes: 48,
    feed: "for-you",
    verified: true,
    avatar: "https://picsum.photos/seed/globalbrief/120/120",
    text: "Several countries are accelerating AI governance talks this quarter, focusing on watermarking standards, model transparency, and election-period safeguards. The biggest challenge is making rules strict enough for safety while keeping innovation open for startups and research teams.",
    image: "https://picsum.photos/seed/ai-governance/1200/700",
    stats: { comments: 124, reposts: 311, likes: 1082, bookmarks: 96, shares: 54 },
  },
  {
    id: "p2",
    author: "EcoTrack",
    handle: "@ecotrack",
    ageMinutes: 65,
    feed: "for-you",
    verified: false,
    avatar: "https://picsum.photos/seed/ecotrack/120/120",
    text: "Cities across South Asia are rolling out early heat-action plans ahead of summer, including cooling zones, hydration points, and school timing adjustments. Public health teams are asking residents to treat heat alerts like storm alerts and plan routines earlier in the day.",
    stats: { comments: 89, reposts: 205, likes: 764, bookmarks: 63, shares: 40 },
  },
  {
    id: "p3",
    author: "Orbit Watch",
    handle: "@orbitwatch",
    ageMinutes: 190,
    feed: "for-you",
    verified: true,
    avatar: "https://picsum.photos/seed/orbitwatch/120/120",
    text: "New lunar mission updates are driving a lot of attention today, with teams publishing fresh imagery and telemetry snapshots. Beyond headlines, scientists say the long-term value is in surface mapping data that can guide future robotic and crewed missions.",
    image: "https://picsum.photos/seed/lunar-mission/1200/700",
    stats: { comments: 71, reposts: 147, likes: 638, bookmarks: 52, shares: 33 },
  },
  {
    id: "p4",
    author: "Jon",
    handle: "@jon1",
    ageMinutes: 36,
    feed: "following",
    verified: false,
    avatar: "https://picsum.photos/seed/jon1/120/120",
    text: "Tried the new electric bus route today and the ride quality was honestly better than expected. If city transit keeps improving frequency and charging uptime like this, adoption will rise naturally without heavy campaigning.",
    stats: { comments: 22, reposts: 37, likes: 214, bookmarks: 18, shares: 12 },
  },
  {
    id: "p5",
    author: "Naina",
    handle: "@naina_ui",
    ageMinutes: 122,
    feed: "following",
    verified: false,
    avatar: "https://picsum.photos/seed/naina-ui/120/120",
    text: "Watched the startup policy panel this evening and one point stood out: small creators and indie builders need simpler compliance playbooks, not bigger documents. Good policy should reduce confusion, not add more layers to basic product launches.",
    image: "https://picsum.photos/seed/startup-policy/1200/700",
    stats: { comments: 17, reposts: 24, likes: 167, bookmarks: 15, shares: 8 },
  },
  {
    id: "p6",
    author: "Ritvik",
    handle: "@ritvik_dev",
    ageMinutes: 305,
    feed: "following",
    verified: false,
    avatar: "https://picsum.photos/seed/ritvik-dev/120/120",
    text: "The big cricket fixtures this week are boosting local cafe screenings again. Interesting to see how sports events still dominate neighborhood business traffic even when most day-to-day entertainment has shifted online.",
    stats: { comments: 31, reposts: 52, likes: 286, bookmarks: 27, shares: 15 },
  },
];

export const HOME_TREND_TAGS = [
  "#AIRegulation",
  "#ClimateAction",
  "#SpaceUpdates",
  "#CricketWeek",
  "#StartupPolicy",
];

export const TREND_ITEMS = [
  { id: "t1", topic: "Frontend Architecture", posts: "12.8K posts" },
  { id: "t2", topic: "Vite + React UI", posts: "8,120 posts" },
  { id: "t3", topic: "Design Systems", posts: "6,402 posts" },
  { id: "t4", topic: "Dark Mode UX", posts: "3,994 posts" },
];

export const NOTIFICATIONS = [
  {
    id: "n1",
    type: "follow",
    message: "Ananya Sharma followed you",
    time: "59s",
  },
  {
    id: "n2",
    type: "mention",
    message: "Rahul mentioned you in a post about GupShup UI",
    time: "16m",
  },
  {
    id: "n3",
    type: "like",
    message: "Your profile update got 12 new likes",
    time: "1h",
  },
  {
    id: "n4",
    type: "security",
    message: "New login detected from Windows device in Delhi",
    time: "1d",
  },
];

export const CHAT_CONTACTS = [
  { id: "c1", name: "Harshit.xd", handle: "@harshit_xd51280", preview: "Can we ship this tonight?", time: "Now" },
  { id: "c2", name: "Naina", handle: "@naina_ui", preview: "Updated the profile card copy.", time: "8m" },
  { id: "c3", name: "Ritvik", handle: "@ritvik_dev", preview: "Pushed auth fixes to branch.", time: "23m" },
];

export const CHAT_MESSAGES = [
  { id: "m1", from: "them", text: "Hey buddy", time: "6:09 PM" },
  { id: "m2", from: "me", text: "hellow", time: "6:10 PM" },
  { id: "m3", from: "them", text: "Looks clean. Let us add real API next.", time: "6:11 PM" },
];

export const RIGHT_PANEL_NEWS = [
  "Macron to Visit India for Strategic Talks and Innovation Launch",
  "AI-Powered Creator Tools Gain Adoption Across Social Platforms",
  "New Chat Safety Controls Announced for Consumer Apps",
];

export const SUGGESTED_USERS = [
  { id: "u1", name: "India & The World", handle: "@IndianInfoGuid" },
  { id: "u2", name: "Autosport", handle: "@autosport" },
  { id: "u3", name: "KJS DHILLON", handle: "@TinyDhillon" },
];
