let htmll = document.getElementsByTagName('html');const html = htmll[0];
let buttons = document.querySelectorAll("[name=theme]");
for(let buton of Array.from(buttons)) {
  buton.addEventListener('change', ()=> {
    changeTheme(buton.value);
    
  })
};

function changeTheme(value) {
  html.setAttribute("data-theme", String(value));
  localStorage.setItem("theme", String(value));
  console.log(localStorage.getItem('theme'))
}
function setTheme() {
  if (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    html.setAttribute("data-theme", "dark")
  } else if (!("theme" in localStorage)) {
    html.setAttribute("data-theme", "light")
  } else {
    html.setAttribute("data-theme", `${localStorage.getItem("theme")}`);
  }
}
setTheme();