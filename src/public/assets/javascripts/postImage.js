
  // Elements
  const tabUrl = document.getElementById('tab-url');
  const tabUpload = document.getElementById('tab-upload');
  const urlArea = document.getElementById('urlInputArea');
  const uploadArea = document.getElementById('uploadInputArea');
  const imageURL = document.getElementById('imageURL');
  const imageFile = document.getElementById('imageFile');
  const previewContainer = document.getElementById('imagePreviewContainer');
  const previewImg = document.getElementById('imagePreview');
  const clearBtn = document.getElementById('clearImage');

  // Configuration
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_WIDTH = 1200; // Resize target width

  // Tab Switching Logic
  tabUrl.onclick = () => {
    tabUrl.classList.add('tab-active');
    tabUpload.classList.remove('tab-active');
    urlArea.classList.remove('hidden');
    uploadArea.classList.add('hidden');
  };

  tabUpload.onclick = () => {
    tabUpload.classList.add('tab-active');
    tabUrl.classList.remove('tab-active');
    uploadArea.classList.remove('hidden');
    urlArea.classList.add('hidden');
  };

  // --- Image Resizing Logic ---

  const loadImage = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

  async function getResizedBlob(file) {
    const originalUrl = URL.createObjectURL(file);
    const img = await loadImage(originalUrl);
    URL.revokeObjectURL(originalUrl); // Clean up memory

    let width = img.width;
    let height = img.height;

    // Calculate new dimensions (keeping aspect ratio)
    if (width > MAX_WIDTH) {
      height = Math.round((height * MAX_WIDTH) / width);
      width = MAX_WIDTH;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
    });
  }

  // --- Event Listeners ---

  imageURL.oninput = (e) => {
    if (e.target.value) showPreview(e.target.value);
    else previewContainer.classList.add('hidden');
  };

  imageFile.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validation: Check if file is less than 5MB
    if (file.size > MAX_FILE_SIZE) {
      window.alert("File is too large! Please select an image smaller than 5MB.");
      imageFile.value = ''; 
      return;
    }

    // 2. Process: Resize the image
    try {
      const resizedBlob = await getResizedBlob(file);
      
      // 3. Replace: Put the resized file back into the input
      const resizedFile = new File([resizedBlob], file.name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(resizedFile);
      imageFile.files = dataTransfer.files;

      // 4. UI: Show preview and clear URL input
      showPreview(URL.createObjectURL(resizedFile));
      imageURL.value = ''; 
    } catch (err) {
      console.error("Image processing failed:", err);
    }
  };

  const showPreview = (src) => {
    previewImg.src = src;
    previewContainer.classList.remove('hidden');
  };

  clearBtn.onclick = () => {
    imageURL.value = '';
    imageFile.value = '';
    previewContainer.classList.add('hidden');
    previewImg.src = '';
  };
