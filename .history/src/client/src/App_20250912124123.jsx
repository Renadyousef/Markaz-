const raw = localStorage.getItem("token"); // خام (بدون Bearer)
const headers = { Authorization: `Bearer ${raw}` };
axios.get("<base-or-proxy>/home/me", { headers });
