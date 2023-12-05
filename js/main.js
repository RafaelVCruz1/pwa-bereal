if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      let reg;
      reg = await navigator.serviceWorker.register("/sw.js", {
        type: "module",
      });

      console.log("Service worker registrada!", reg);
    } catch (err) {
      console.log("Service worker registro falhou: ", err);
    }
  });
}

var camMode = "user";
var constraints = { video: { facingMode: camMode }, audio: false };
const cameraView = document.querySelector("#camera--view"),
  cameraOutput = document.querySelector("#camera--output"),
  cameraSensor = document.querySelector("#camera--sensor"),
  cameraTrigger = document.querySelector("#camera--trigger"),
  cameraSwitch = document.querySelector("#camera--switch");

let db; 

function cameraStart() {
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      let track = stream.getTracks()[0];
      cameraView.srcObject = stream;
    })
    .catch(function (error) {
      console.error("Ocorreu um Erro.", error);
    });
}

cameraSwitch.onclick = function () {
  stopMediaTracks(cameraView.srcObject);
  camMode = camMode === "user" ? "environment" : "user";
  constraints = { video: { facingMode: camMode }, audio: false };
  console.log(constraints);
  cameraStart();
};

function stopMediaTracks(stream) {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

cameraTrigger.onclick = function () {
  cameraSensor.width = cameraView.videoWidth;
  cameraSensor.height = cameraView.videoHeight;
  cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
  const imageUrl = cameraSensor.toDataURL("image/webp");
  cameraOutput.src = imageUrl;
  cameraOutput.classList.add("taken");

  saveImageToDb(imageUrl);
};

window.addEventListener("load", () => {
  cameraStart();
  initDb();
}, false);

function initDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('Banco BeReal', 1);

    request.onerror = (event) => {
      console.error("Erro ao abrir o banco de dados:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log("Banco de dados aberto!!");
      resolve();
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
      console.log("Armazenamento criado com sucesso!!!");
    };
  });
}

async function saveImageToDb(imageUrl) {
  try {
    if (!db) {
      console.error("Banco de dados não inicializado corretamente.");
      return;
    }

    const transaction = db.transaction('images', 'readwrite');
    const objectStore = transaction.objectStore('images');
    const imageObject = { url: imageUrl, timestamp: new Date().getTime() };

    await objectStore.add(imageObject);
    console.log("Imagem salva no IndexedDB!!!!");
  } catch (error) {
    console.error("Erro ao adicionar imagem ao IndexedDB:", error);
  }
}
