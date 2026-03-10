function switchTab(event, tabId) {
  // 1. Remove active state from all tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('tab-active');
  });

  // 2. Hide all content sections
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.remove('block');
  });

  // 3. Show the selected content and set tab to active
  event.currentTarget.classList.add('tab-active')

  const activeContent = document.getElementById(tabId);
  activeContent.classList.add('block');
  const header = document.getElementsByTagName("header")[0]
  console.log(header.clientHeight)
  window.scrollTo({
    top: header.clientHeight,
    behavior: 'smooth'
  });
  // 4. IMPORTANT: Re-run Feather icons and Scroll Observer 
  // so icons show up in the newly visible tab
  if (typeof feather !== 'undefined') feather.replace();
}
const photoInput = document.getElementById("photo_input");
photoInput.addEventListener("change", async (event) => {
  const preview = document.getElementById("preview_photo");
  const userSvg = document.getElementById("user_svg");
  const saveBtn = document.getElementById("btn_save_photo");
  const edit_info = document.getElementById("edit_info");
  const newPhoto = photoInput.files[0];
  if (!newPhoto.type.startsWith("image")) {
    edit_info.textContent = "❗Please select a image.";
    saveBtn.disabled = true;
    return
  }

  const awater = await cropCenterResize(newPhoto);
  userSvg.style.display = "none";
  preview.hidden = false;
  const prePhotoURL = URL.createObjectURL(awater);
  preview.src = prePhotoURL
  preview.addEventListener("load", (event) => {
    URL.revokeObjectURL(prePhotoURL)
  })
  console.log(awater)
  if (newPhoto.size / 1000 * 1000 > 3 * 1000 * 1000) {
    edit_info.textContent = "❗This image size is bigger than 3MB"
    saveBtn.disabled = true
  } else {
    edit_info.textContent = "✅ You can Save this."
    saveBtn.disabled = false
  }
  saveBtn.addEventListener("click", async (event) => {
    edit_info.textContent = "Uploading image..."

    const req = await fetch("/users/update/photo/{{user.username}}", {
      method: "POST",
      body: await awater.arrayBuffer(),
      headers: {
        "content-type": "application/octet-stream",
        "phototype": awater.type.replace("image/", "")
      }
    })
    const res = await req.text();
    if (res === 'success') {
      console.log("ok")
      const reloadLink = document.createElement("a");
      reloadLink.href = "/users/profile/{{user.username}}"
      reloadLink.click();
    }
    modal_edit_photo.close()
  })
});
async function cropCenterResize(file) {
  const img = await loadImage(file);

  const size = Math.min(img.width, img.height);

  // Center crop coordinates
  const sx = Math.floor((img.width - size) / 2);
  const sy = Math.floor((img.height - size) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);

  return new Promise((resolve) => {
    canvas.toBlob(
      resolve,
      "image/jpeg",
      0.9 // safe quality, still tiny
    );
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      resolve(img);
    }
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
const modal_about = document.getElementById("modal_about");
const save_about = document.getElementById("save_about");
const modal_about_textarea = document.getElementById("modal_about_textarea");

const personal_info = document.getElementById("personal_info")
const btn_p_edit = document.getElementById("btn_p_edit");
const form_personal = document.getElementById("form_personal");
const about = document.getElementById("about");
if (about.textContent.length < 10) modal_about.showModal()

btn_p_edit.onclick = () => {
  form_personal.hidden = false;
  personal_info.hidden = true;
  btn_p_edit.innerHTML = ` <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Editing`
}
const cancle_p_edit = document.getElementById("cancle_p_edit");
cancle_p_edit.onclick = () => {
  form_personal.hidden = true;
  personal_info.hidden = false;
  btn_p_edit.innerHTML = ` <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit`
}

modal_about_textarea.onkeyup = () => {
  const about = modal_about_textarea.value;
  if (about.length < 10) {
    save_about.disabled = true
  } else save_about.disabled = false

}

form_personal.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (form_personal.hidden) return;
  const res = await fetch("/users/profile/update/personal", {
    method: "POST",
    body: JSON.stringify({
      about: document.getElementById("input_about").value,
      displayName: document.getElementById("input_display_name").value,
      firstName: document.getElementById("input_first_name").value,
      lastName: document.getElementById("input_last_name").value
    }),
    headers: {
      "Content-type": "application/json"
    }
  });
  console.log(res.status)
  if (res.status === 200) {
    const resText = await res.text();
    const udpatedUser = JSON.parse(resText);
    document.getElementById("display_name").textContent = udpatedUser.displayName;
    document.getElementById("first_name").textContent = udpatedUser.firstName;
    document.getElementById("last_name").textContent = udpatedUser.lastName;
    document.getElementById("about").textContent = udpatedUser.about;
    document.getElementById("p_edit_time").textContent = "Updated At: " + new Date().toLocaleTimeString();
    btn_p_edit.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit h-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>Edit`
    form_personal.hidden = true;
    personal_info.hidden = false
  }
});
save_about.onclick = async function () {
  try {
    const res = await fetch("/users/profile/update/about", {
      method: "POST",
      body: JSON.stringify({ about: modal_about_textarea.value }),
      headers: {
        "Content-type": "application/json"
      }
    });
    const resText = await res.text()
    if (resText === modal_about_textarea.value) {
      document.getElementById("about").textContent = resText
      document.getElementById("input_about").value = resText;
    }
    console.log(resText)
    modal_about.close()
  } catch (err) {

  }
};
const input_delete = document.getElementById("input_delete");
const btn_delete = document.getElementById("btn_delete");
input_delete.addEventListener("keyup", (event) => {
  if (input_delete.value === "delete" || input_delete.value === "Delete") {
    btn_delete.disabled = false;
  }
  else {
    btn_delete.disabled = true;
  }
})
