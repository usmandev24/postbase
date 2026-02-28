class LikesControl {
  constructor() {
    this.likeButtons = document.querySelectorAll(".like-btn")
  }
  async init() {
    await this.setLikes()
    this.attachEvents()
  }
  async setLikes() {
    const res = await fetch('/users/likes/keys').then(async res => await res.text())
    if (!res) return
    const likeKeys = JSON.parse(res);
    Array.from(this.likeButtons).forEach(btn => {
      const postkey = btn.getAttribute("data-postkey")
      if (likeKeys.includes(postkey)) {
        btn.className = "like-btn btn btn-ghost btn-sm gap-2 text-primary";
        btn.setAttribute("data-isliked", "true");
        document.getElementById(postkey + "-likeLogo").setAttribute("class", "fill-primary h-4 w-4 ")
      }
    })

  }
  attachEvents() {
    Array.from(this.likeButtons).forEach((btn, i) => {
      btn.addEventListener("click", async (event) => {

        if (btn.getAttribute("data-isliked") === "true") {
          const postkey = btn.getAttribute("data-postkey")
          const userId = document.getElementById("userid").getAttribute("data-userid")
          btn.disabled = true;
          btn.classList.replace("btn-ghost", "btn-active")
          try {
            const res = await this.fetchApi("/posts/likes/destroy", "POST", JSON.stringify({
              postkey: postkey,
              userId: userId
            }))
            if (res === "Ok") {
              this.toUnLiked(btn, postkey)
            }
          } catch (err) {
            console.error(err)
          } finally {
            setTimeout(() => {
              btn.disabled = false
            }, 500)
          }
        } else {
          const postkey = btn.getAttribute("data-postkey");
          const userId = document.getElementById("userid").getAttribute("data-userid")
          btn.classList.replace("btn-ghost", "btn-active")
          btn.disabled = true;
          try {
            const res = await this.fetchApi("/posts/likes/add", "POST", JSON.stringify({
              postkey: postkey,
              userId: userId
            }))
            if (res === "Ok") {
              this.toLiked(btn, postkey)
            }
          } catch (err) {
            console.error(err)
          } finally {
            setTimeout(() => {
              btn.disabled = false
            }, 500)
          }
        }
      })
    })
  }
  async fetchApi(url, method, body) {
    const res = await fetch(url, {
      body,
      method,
      headers: { "content-type": "application/json" }
    })
    return await res.text()
  }
  toLiked(btn, postkey) {
    btn.setAttribute("data-isliked", "true")
    btn.className = "like-btn btn btn-ghost btn-sm gap-2 text-primary";
    let totalLikes = document.getElementById(postkey + "-likes").textContent
    document.getElementById(postkey + "-likes").textContent = Number(totalLikes) + 1;
    document.getElementById(postkey + "-likeLogo").setAttribute("class", "h-4 w-4 fill-primary")
  }
  toUnLiked(btn, postkey) {
    btn.setAttribute("data-isliked", "false")
    btn.className = "like-btn btn btn-ghost btn-sm gap-2 text-success";
    document.getElementById(postkey + "-likes").textContent -= 1;
    document.getElementById(postkey + "-likeLogo").setAttribute("class", "h-4 w-4")

  }

}
window.addEventListener("load", () => {
  new LikesControl().init()
})