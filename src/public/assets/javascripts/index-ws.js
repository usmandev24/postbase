ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'connection') {
    console.log(data.message);
  } else if (data.type === 'postcreated') {
    // 1. Hide empty div if it exists
    if (emptyDiv) emptyDiv.style.display = 'none';

    // 2. Create the wrapper
    const postDiv = document.createElement('div');

    class PostUI {
      static render(post) {
        // Helper to generate category links
        const renderCategories = (catgs) => {
          if (!catgs || !catgs.length) return '';
          return catgs.map(cat => `
        <a href="/explore/${cat.catgName}"
           class="text-[10px] font-black uppercase text-primary/90 tracking-wide hover:underline">
           #${cat.catgName}
        </a>
      `).join('');
        };

        // Helper for conditional cover photo
        const renderCover = (coverPic, key, title) => {
          if (!coverPic) return '';
          return `
        <a href="/posts/view?key=${key}"
           class="block mb-4 aspect-16/8 overflow-hidden rounded-2xl border border-base-200 bg-base-200/30">
          <img src="${coverPic}" alt="${title}" class="w-full h-full object-cover rounded-2xl" />
        </a>
      `;
        };

        return `
    <div id="${post.key}"
      class="card bg-base-200/60 dark:bg-base-200/50 border border-base-200 shadow-sm hover:border-base-300 transition-colors mb-2">

      <div class="card-body p-4 sm:p-7">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="avatar">
              <div class="w-11 h-11 rounded-xl bg-base-200">
                <img src="${post.auther.photoURL}" alt="${post.auther.username}">
              </div>
            </div>
            <div class="flex flex-col">
              <a href="/users/profile/${post.auther.username}"
                class="font-black text-base tracking-tight hover:underline transition-all">
                ${post.auther.username}
              </a>
              <div class="flex items-center gap-2 mt-0.5">
                <span data-time="${post.updatedAt}"
                  class="updatedAt text-[11px] font-bold opacity-70 uppercase tracking-widest">Just Now</span>
                <span class="w-1 h-1 rounded-full bg-base-300"></span>
                <div class="hidden sm:flex gap-2 flex-wrap">
                  ${renderCategories(post.catgs)}
                </div>
              </div>
            </div>
          </div>

          <div id="${post.key}-info-container" class="flex flex-col items-end">
            <span id="${post.key}-info"
              class="badge badge-success badge-outline border-2 text-[10px] font-black uppercase px-2 py-3 rounded-lg">New</span>
          </div>
        </div>

        <div class="sm:hidden flex gap-2 mb-3">
          ${renderCategories(post.catgs)}
        </div>

        <a id="${post.key}-link" href="/posts/view?key=${post.key}" class="block mb-4 group cursor-pointer">
          <h2 id="${post.key}-title"
            class="text-xl md:text-2xl font-black tracking-tight leading-[1.2] mb-2 group-hover:text-primary transition-colors">
            ${post.title}
          </h2>
          <div id="${post.key}-body" class="text-base-content/80 text-sm md:text-base line-clamp-3 leading-relaxed">
            ${post.body}
          </div>
        </a>

        ${renderCover(post.coverPic, post.key, post.title)}

        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center gap-1">
            <button data-postkey="${post.key}"
              class="like-btn flex items-center gap-2 px-3 py-2 rounded-xl text-base-content/60 hover:text-success hover:bg-success/10 transition-colors">
              <span id="${post.key}-likeLogo" data-feather="thumbs-up" class="h-4 w-4"></span>
              <span id="${post.key}-likes" class="font-black text-xs">${post._count.likes}</span>
            </button>

            <div class="flex items-center gap-2 px-3 py-2 rounded-xl text-base-content/60 cursor-default">
              <span data-feather="message-circle" class="h-4 w-4"></span>
              <span id="${post.key}-comments" class="font-black text-xs">${post._count.comments}</span>
            </div>
          </div>

          <a href="/posts/view?key=${post.key}"
            class="btn btn-ghost btn-sm rounded-xl px-4 text-xs font-black tracking-widest hover:text-primary transition-colors">
            Read <span data-feather="arrow-right" class="h-5 w-9"></span>
          </a>
        </div>
      </div>
    </div>`;
      }
    }
    postDiv.innerHTML = PostUI.render(data.post)
    postlist.prepend(postDiv);
    feather.replace();
  } else if (data.type === 'postdestroyed') {
    const postCard = document.getElementById(data.key);
    const postInfo = document.getElementById(data.key + "-info");
    const postLink = document.getElementById(data.key + "-link");

    if (postCard && postLink) {
      // Disable link
      postLink.onclick = (event) => event.preventDefault();
      postLink.removeAttribute("href");

      // Visual updates to look "Deleted"
      postCard.classList.add("opacity-50", "grayscale", "cursor-not-allowed");

      if (postInfo) {
        postInfo.textContent = "Deleted";
        postInfo.className = "badge badge-error badge-sm";
      }
    }
  } else if (data.type === "commentcreated") {
    const cSpan = document.getElementById(data.postkey + "-comments")
    cSpan.textContent = Number(cSpan.textContent) + 1;
    const infoSpan = document.getElementById(`${data.postkey}-info`)
    infoSpan.textContent = "New Comment"

  } else if (data.type === "commentdestroyed") {
    const cSpan = document.getElementById(data.postkey + "-comments")
    cSpan.textContent = Number(cSpan.textContent) - 1;
    const infoSpan = document.getElementById(`${data.postkey}-info`)
    infoSpan.textContent = "Comment deleted"

  } else if (data.type === "postupdated") {
    const infoSpan = document.getElementById(`${data.post.key}-info`)
    infoSpan.textContent = "Updated"
  }
});
