// Registrando a service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      let reg;
      reg = await navigator.serviceWorker.register("/sw.js", {
        type: "module",
      });

      console.log("Service worker registrada! 😎", reg);
    } catch (err) {
      console.log("😥 Service worker registro falhou: ", err);
    }
  });
}

var camMode = "user";
// Configurando as constraints do video stream
var constraints = { video: { facingMode: camMode }, audio: false };
// Capturando os elementos em tela
const cameraView = document.querySelector("#camera--view"),
  cameraOutput = document.querySelector("#camera--output"),
  cameraSensor = document.querySelector("#camera--sensor"),
  cameraTrigger = document.querySelector("#camera--trigger"),
  cameraSwitch = document.querySelector("#camera--switch");

let db; // Adicionando a variável db para armazenar o objeto do banco de dados

// Estabelecendo o acesso à câmera e inicializando a visualização
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

// Função para tirar foto e armazenar no IndexedDB
cameraTrigger.onclick = function () {
  cameraSensor.width = cameraView.videoWidth;
  cameraSensor.height = cameraView.videoHeight;
  cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
  const imageUrl = cameraSensor.toDataURL("image/webp");
  cameraOutput.src = imageUrl;
  cameraOutput.classList.add("taken");

  // Armazenar a imagem no IndexedDB
  saveImageToDb(imageUrl);
};

// Função para iniciar a câmera e o IndexedDB quando a janela carregar
window.addEventListener("load", () => {
  cameraStart();
  initDb();
}, false);

// Função para inicializar o IndexedDB
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

// Função para salvar a imagem no IndexedDB
async function saveImageToDb(imageUrl) {
  try {
    // Verifique se db está definido antes de continuar
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
