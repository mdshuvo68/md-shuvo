const generateBtn = document.getElementById("generateBtn");
const qrNameInput = document.getElementById("qrName");
const textInput = document.getElementById("text");
const colorDarkInput = document.getElementById("colorDark");
const colorLightInput = document.getElementById("colorLight");
const logoFileInput = document.getElementById("logoFile");
const output = document.getElementById("output");
const downloadLink = document.getElementById("downloadLink");
const downloadFormatSelect = document.getElementById("downloadFormat");
const downloadSection = document.getElementById("downloadSection");

const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
const historySection = document.getElementById("history");
const historyList = document.getElementById("historyList");
const searchInput = document.getElementById("searchInput");

const historyQRCodeSection = document.getElementById("historyQRCode");
const historyQROutput = document.getElementById("historyQROutput");
const historyDownloadLink = document.getElementById("historyDownloadLink");
const historyDownloadFormat = document.getElementById("historyDownloadFormat");
const deleteHistoryBtn = document.getElementById("deleteHistoryBtn");

const toggleThemeBtn = document.getElementById("toggleThemeBtn");

let selectedHistoryIndex = -1;

function generateQRCode() {
  const name = qrNameInput.value.trim();
  const text = textInput.value.trim();
  const colorDark = colorDarkInput.value;
  const colorLight = colorLightInput.value;
  const logoFile = logoFileInput.files[0];

  output.innerHTML = "";
  downloadLink.classList.add("hidden");
  downloadSection.classList.add("hidden");

  if (!name || !text) {
    output.innerHTML = `<p style="color:red">
Name and link are required.</p>`;
    return;
  }

  const canvas = document.createElement("canvas");

  function drawQRCode(logoImg) {
    QRCode.toCanvas(canvas, text, {
      color: { dark: colorDark, light: colorLight },
      width: 300,
      margin: 2,
    }, function (error) {
      if (error) {
        output.innerHTML = `<p style="color:red">QR কোড তৈরি করতে সমস্যা হয়েছে।</p>`;
        return;
      }

      if (logoImg) {
        const ctx = canvas.getContext("2d");
        const imgSize = canvas.width * 0.2;
        const x = (canvas.width - imgSize) / 2;
        const y = (canvas.height - imgSize) / 2;
        ctx.drawImage(logoImg, x, y, imgSize, imgSize);
      }

      output.appendChild(canvas);
      downloadSection.classList.remove("hidden");
      downloadLink.classList.remove("hidden");
      updateDownloadLink(canvas, downloadFormatSelect.value);

      saveToHistory({ name, text, colorDark, colorLight });
      loadHistory();
    });
  }

  if (logoFile) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const logoImg = new Image();
      logoImg.onload = function () {
        drawQRCode(logoImg);
      };
      logoImg.src = e.target.result;
    };
    reader.readAsDataURL(logoFile);
  } else {
    drawQRCode(null);
  }
}

function updateDownloadLink(canvas, format) {
  if (format === "png") {
    downloadLink.href = canvas.toDataURL("image/png");
    downloadLink.download = "qrcode.png";
  } else if (format === "jpg") {
    const jpgUrl = canvas.toDataURL("image/jpeg", 0.9);
    downloadLink.href = jpgUrl;
    downloadLink.download = "qrcode.jpg";
  }
}

downloadFormatSelect.addEventListener("change", () => {
  const canvas = output.querySelector("canvas");
  if (!canvas) return;
  updateDownloadLink(canvas, downloadFormatSelect.value);
});

toggleHistoryBtn.addEventListener("click", () => {
  if (historySection.classList.contains("hidden")) {
    historySection.classList.remove("hidden");
    searchInput.classList.remove("hidden");
    loadHistory();
  } else {
    historySection.classList.add("hidden");
    searchInput.classList.add("hidden");
  }
});

searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase();
  Array.from(historyList.children).forEach(li => {
    if (li.textContent.toLowerCase().includes(filter)) {
      li.style.display = "";
    } else {
      li.style.display = "none";
    }
  });
});

function saveToHistory(qrData) {
  let history = JSON.parse(localStorage.getItem("qrHistory") || "[]");

  const exists = history.some(item => item.name === qrData.name && item.text === qrData.text);
  if (!exists) {
    history.unshift(qrData);
    if (history.length > 10) history.pop();
    localStorage.setItem("qrHistory", JSON.stringify(history));
  }
}

function loadHistory() {
  historyList.innerHTML = "";
  let history = JSON.parse(localStorage.getItem("qrHistory") || "[]");

  if (history.length === 0) {
    historyList.innerHTML = "<li>কোনো পূর্বের ডেটা নেই</li>";
    return;
  }

  history.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.text}`;
    li.dataset.index = index;
    li.addEventListener("click", () => {
      showHistoryQRCode(index);
    });
    historyList.appendChild(li);
  });
}

function showHistoryQRCode(index) {
  selectedHistoryIndex = index;
  const history = JSON.parse(localStorage.getItem("qrHistory") || "[]");
  if (!history[index]) return;
  const data = history[index];

  historyQROutput.innerHTML = "";
  const canvas = document.createElement("canvas");

  QRCode.toCanvas(canvas, data.text, {
    color: { dark: data.colorDark, light: data.colorLight },
    width: 300,
    margin: 2,
  }, (err) => {
    if (err) {
      historyQROutput.innerHTML = "<p style='color:red'>There was a problem displaying the QR code.</p>";
      return;
    }

    historyQROutput.appendChild(canvas);
    historyQRCodeSection.classList.remove("hidden");
    updateHistoryDownloadLink(canvas, historyDownloadFormat.value);
  });
}

function updateHistoryDownloadLink(canvas, format) {
  if (format === "png") {
    historyDownloadLink.href = canvas.toDataURL("image/png");
    historyDownloadLink.download = "qrcode.png";
  } else if (format === "jpg") {
    historyDownloadLink.href = canvas.toDataURL("image/jpeg", 0.9);
    historyDownloadLink.download = "qrcode.jpg";
  } else if (format === "svg") {
    // QRCode lib does not support direct canvas to SVG, so fallback to PNG or hide download link
    historyDownloadLink.href = "";
    historyDownloadLink.classList.add("hidden");
  }
  if(format !== "svg") historyDownloadLink.classList.remove("hidden");
}

historyDownloadFormat.addEventListener("change", () => {
  const canvas = historyQROutput.querySelector("canvas");
  if (!canvas) return;
  updateHistoryDownloadLink(canvas, historyDownloadFormat.value);
});

deleteHistoryBtn.addEventListener("click", () => {
  if(selectedHistoryIndex < 0) return;

  const reason = prompt("Please enter the reason for deletion:");

  if(reason && reason.trim().length > 0) {
    let history = JSON.parse(localStorage.getItem("qrHistory") || "[]");
    history.splice(selectedHistoryIndex, 1);
    localStorage.setItem("qrHistory", JSON.stringify(history));
    selectedHistoryIndex = -1;
    historyQRCodeSection.classList.add("hidden");
    loadHistory();
  } else {
    alert("You must provide a reason for deletion!");
  }
});

toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Init
generateBtn.addEventListener("click", generateQRCode);
loadHistory();
