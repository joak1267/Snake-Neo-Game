// Configuración y Variables
let filas = 20, columnas = 20, bs = 20;
let posX = [], posY = [];
let dir = 3, proximaDir = 3; 
let dx = [0, 0, -1, 1], dy = [-1, 1, 0, 0];
let appleX, appleY;
let objListX = [], objListY = [];

let ultimoMovimiento = 0;
let intervaloMovimiento = 200; 

let nivel = 1, manzanasObtenidas = 0;
let menu = true, gameOver = false, ingresandoNombre = false;
let mostrandoRanking = false, pantallaReintento = false, juegoGanado = false;

let nombresRanking = [], puntajesRanking = [];
let nombreJugador = "";
let particulas = [];
let coloresSpray = ['#FF0000', '#00FF96', '#FFFFFF'];
let mostrarSpray = false, tiempoSpray = 0;

// Variables para soporte móvil y teclado
let xDown = null, yDown = null;
let inputNombre; // El campo invisible para el teclado móvil

function setup() {
  let tamanoContenedor = min(windowWidth - 20, 400);
  bs = tamanoContenedor / columnas;
  let canvas = createCanvas(tamanoContenedor, tamanoContenedor + 50);
  canvas.parent('game-container');
  textFont('Press Start 2P'); 

  // Crear el input invisible para móviles
  inputNombre = createInput('');
  inputNombre.attribute('maxlength', '8');
  inputNombre.style('position', 'absolute');
  inputNombre.style('opacity', '0'); // Invisible
  inputNombre.style('pointer-events', 'none'); // No estorba clics
  inputNombre.input(actualizarNombreDesdeInput);
  inputNombre.hide();

  reiniciarJuego();
}

function actualizarNombreDesdeInput() {
  nombreJugador = this.value().toUpperCase();
}

function draw() {
  background(10); 

  if (mostrarSpray) {
    dibujarTablero();
    actualizarParticulas();
    textAlign(CENTER, CENTER);
    fill(255, 0, 0); textSize(25);
    text("¡MORISTE!", width/2, height/2);
    if (--tiempoSpray <= 0) {
      mostrarSpray = false;
      if (manzanasObtenidas > 5) activarIngresoNombre();
      else pantallaReintento = true;
    }
    return;
  }

  if (menu) mostrarMenu();
  else if (juegoGanado) mostrarPantallaVictoria();
  else if (mostrandoRanking) mostrarRanking();
  else if (ingresandoNombre) mostrarPantallaNombre();
  else if (pantallaReintento) mostrarPantallaReintento();
  else juego();
}

function activarIngresoNombre() {
  ingresandoNombre = true;
  inputNombre.show();
  inputNombre.value('');
  inputNombre.elt.focus(); // Esto abre el teclado en móviles
}

function juego() {
  if (gameOver) {
    manzanasObtenidas = posX.length - 1;
    crearSpray(posX[0] * bs + bs/2, (posY[0] * bs + bs/2) + 50);
    return;
  }
  
  dibujarTablero();
  dibujarEntidades();
  dibujarHUD();

  if (millis() - ultimoMovimiento > intervaloMovimiento) {
    dir = proximaDir;
    moverSerpiente();
    ultimoMovimiento = millis();
  }
}

function moverSerpiente() {
  let headX = posX[0] + dx[dir];
  let headY = posY[0] + dy[dir];
  
  if (headX < 0 || headX >= columnas || headY < 0 || headY >= filas) gameOver = true;
  for (let i = 0; i < posX.length; i++) if (headX === posX[i] && headY === posY[i]) gameOver = true;
  for (let i = 0; i < objListX.length; i++) if (headX === objListX[i] && headY === objListY[i]) gameOver = true;

  if (!gameOver) {
    posX.unshift(headX);
    posY.unshift(headY);
    if (headX === appleX && headY === appleY) {
      manzanasObtenidas = posX.length - 1;
      if (objListX.length < 45) agregarObstaculoSeguro();
      encontrarPosicionManzana();
      checkNivel();
    } else {
      posX.pop(); posY.pop();
    }
  }
}

function touchStarted() {
  xDown = mouseX;
  yDown = mouseY;

  if (menu) {
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100) {
      if (mouseY > height/2 - 30 && mouseY < height/2 + 20) { menu = false; reiniciarJuego(); }
      if (mouseY > height/2 + 40 && mouseY < height/2 + 90) { mostrandoRanking = true; menu = false; }
    }
  } else if (pantallaReintento) {
    if (mouseX > width/2 - 90 && mouseX < width/2 + 90 && mouseY > height/2 + 20 && mouseY < height/2 + 70) {
      reiniciarJuego();
    }
    if (mouseX > width/2 - 70 && mouseX < width/2 + 70 && mouseY > height/2 + 85 && mouseY < height/2 + 120) {
      menu = true; pantallaReintento = false;
    }
  } else if (juegoGanado) {
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100 && mouseY > height/2 + 30 && mouseY < height/2 + 80) {
      juegoGanado = false; activarIngresoNombre();
    }
  } else if (mostrandoRanking) {
    if (mouseX > width/2 - 100 && mouseX < width/2 + 100) {
      if (mouseY > height - 60 && mouseY < height - 15) {
        menu = true;
        mostrandoRanking = false;
      }
    }
  } else if (ingresandoNombre) {
    inputNombre.elt.focus(); // Re-enfocar si el usuario toca la pantalla
  }
  return false;
}

function touchEnded() {
  if (!xDown || !yDown) return;
  let xUp = mouseX, yUp = mouseY;
  let xDiff = xDown - xUp, yDiff = yDown - yUp;
  if (abs(xDiff) > abs(yDiff)) {
    if (abs(xDiff) > 30) {
      if (xDiff > 0 && dir !== 3) proximaDir = 2; else if (dir !== 2) proximaDir = 3;
    }
  } else {
    if (abs(yDiff) > 30) {
      if (yDiff > 0 && dir !== 1) proximaDir = 0; else if (dir !== 0) proximaDir = 1;
    }
  }
  xDown = null; yDown = null;
  return false;
}

function keyPressed() {
  if (!gameOver && !menu && !ingresandoNombre && !mostrandoRanking) {
    if (keyCode === UP_ARROW && dir !== 1) proximaDir = 0;
    if (keyCode === DOWN_ARROW && dir !== 0) proximaDir = 1;
    if (keyCode === LEFT_ARROW && dir !== 3) proximaDir = 2;
    if (keyCode === RIGHT_ARROW && dir !== 2) proximaDir = 3;
  }

  if (keyCode === ENTER || keyCode === RETURN) {
    if (pantallaReintento) reiniciarJuego();
    else if (juegoGanado) { juegoGanado = false; activarIngresoNombre(); }
    else if (ingresandoNombre) { 
      guardarPuntaje(); 
      ingresandoNombre = false; 
      inputNombre.hide();
      mostrandoRanking = true; 
    }
  }
  
  if (key === 'm' || key === 'M') {
    if (pantallaReintento || ingresandoNombre) { 
      pantallaReintento = false; 
      ingresandoNombre = false; 
      inputNombre.hide();
      menu = true; 
    }
  }

  if (mostrandoRanking && key === ' ') { mostrandoRanking = false; menu = true; }
  return false; 
}

function mostrarPantallaVictoria() {
  background(10, 50, 20);
  textAlign(CENTER, CENTER);
  fill(255, 215, 0); textSize(22);
  text("¡REY SNAKE!", width/2, height/2 - 40);
  textSize(40); text("👑", width/2, height/2 - 90);
  dibujarBoton(width/2 - 100, height/2 + 30, 200, 50, "RANKING", color(255, 215, 0));
}

function mostrarPantallaReintento() {
  background(0);
  textAlign(CENTER, CENTER);
  fill(255, 50, 50); textSize(25);
  text("PERDISTE", width/2, height/2 - 50);
  dibujarBoton(width/2 - 100, height/2, 200, 50, "REINTENTAR", color(0, 255, 150));
  dibujarBoton(width/2 - 100, height/2 + 60, 200, 50, "MENÚ", color(150));
}

function mostrarMenu() {
  background(5);
  dibujarTablero();
  textAlign(CENTER, CENTER);
  fill(0, 255, 150); textSize(24);
  text("SNAKE NEO ARCADE", width/2, height/4);
  dibujarBoton(width/2 - 100, height/2 - 30, 200, 50, "PLAY", color(0, 255, 150));
  dibujarBoton(width/2 - 100, height/2 + 40, 200, 50, "RANKING", color(255, 200, 0));
}

function mostrarRanking() {
  background(5); fill(0, 255, 150); textSize(20); textAlign(CENTER, TOP); text("RANKING", width/2, 40);
  for (let i = 0; i < min(nombresRanking.length, 5); i++) {
    fill(i === 0 ? color(255, 215, 0) : 255);
    textAlign(LEFT); textSize(10); text((i+1) + "." + nombresRanking[i], width*0.2, 120 + i*40);
    textAlign(RIGHT); text(puntajesRanking[i] + "PTS", width*0.8, 120 + i*40);
  }
  dibujarBoton(width/2 - 100, height - 60, 200, 45, "VOLVER", color(255, 200, 0));
}

function dibujarBoton(x, y, w, h, txt, c) {
  let hover = mouseX > x && mouseX < x+w && mouseY > y && mouseY < y+h;
  stroke(c); strokeWeight(2); fill(hover ? c : 0);
  rect(x, y, w, h, 5);
  noStroke(); fill(hover ? 0 : 255); textSize(12); text(txt, x + w/2, y + h/2);
}

function dibujarTablero() {
  push(); translate(0, 50);
  for (let i = 0; i < columnas; i++) {
    for (let j = 0; j < filas; j++) {
      fill((i + j) % 2 === 0 ? 15 : 10); noStroke();
      rect(i * bs, j * bs, bs, bs);
    }
  }
  pop();
}

function dibujarEntidades() {
  push(); translate(0, 50);
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = '#FF0032';
  fill(255, 0, 50); ellipse(appleX * bs + bs/2, appleY * bs + bs/2, bs*0.8);
  for (let i = 0; i < posX.length; i++) {
    let g = map(i, 0, posX.length, 255, 50);
    drawingContext.shadowColor = `rgba(0, ${g}, 150, 0.5)`;
    fill(0, g, 150);
    rect(posX[i] * bs + 1, posY[i] * bs + 1, bs - 2, bs - 2, 4);
  }
  drawingContext.shadowColor = '#B432FF';
  fill(180, 50, 255);
  for (let i = 0; i < objListX.length; i++) rect(objListX[i] * bs + 2, objListY[i] * bs + 2, bs - 4, bs - 4, 2);
  pop();
}

function checkNivel() {
  if (manzanasObtenidas === 5) { nivel = 2; intervaloMovimiento = 160; }
  else if (manzanasObtenidas === 12) { nivel = 3; intervaloMovimiento = 130; }
  else if (manzanasObtenidas === 20) { nivel = 4; intervaloMovimiento = 100; }
  else if (manzanasObtenidas === 25) { nivel = 5; intervaloMovimiento = 80; }
  else if (manzanasObtenidas === 35) juegoGanado = true;
}

function dibujarHUD() {
  fill(20); noStroke(); rect(0, 0, width, 50);
  fill(0, 255, 150); textAlign(LEFT, CENTER); textSize(10); text("NIVEL:" + nivel, 20, 25);
  textAlign(RIGHT, CENTER); fill(255, 50, 50); text("MANZANAS:" + manzanasObtenidas, width - 20, 25);
}

function reiniciarJuego() {
  gameOver = false; pantallaReintento = false; juegoGanado = false;
  nivel = 1; manzanasObtenidas = 0; intervaloMovimiento = 200;
  posX = [10]; posY = [10]; dir = 3; proximaDir = 3;
  objListX = []; objListY = [];
  encontrarPosicionManzana();
  for (let i = 0; i < 3; i++) agregarObstaculoSeguro();
}

function encontrarPosicionManzana() {
  let ok = false;
  while (!ok) {
    appleX = floor(random(columnas)); appleY = floor(random(filas));
    ok = true;
    for (let i = 0; i < posX.length; i++) if (appleX === posX[i] && appleY === posY[i]) ok = false;
    for (let i = 0; i < objListX.length; i++) if (appleX === objListX[i] && appleY === objListY[i]) ok = false;
  }
}

function agregarObstaculoSeguro() {
  let ok = false; let intentos = 0;
  while (!ok && intentos < 100) {
    let nx = floor(random(columnas)), ny = floor(random(filas));
    intentos++;
    if (dist(nx, ny, posX[0], posY[0]) > 4) {
      if (nx !== appleX || ny !== appleY) {
        objListX.push(nx); objListY.push(ny); ok = true;
      }
    }
  }
}

function mostrarPantallaNombre() {
  background(10); textAlign(CENTER, CENTER);
  fill(0, 255, 150); textSize(14); text("NUEVO RECORD!", width/2, height/4);
  fill(255); textSize(12); text("NOMBRE: " + nombreJugador + (frameCount % 30 < 15 ? "_" : ""), width/2, height/2);
  textSize(8); fill(150); text("(TOCA PARA ABRIR TECLADO)", width/2, height/2 + 40);
  
  // Botón para confirmar nombre en móvil
  dibujarBoton(width/2 - 100, height - 60, 200, 45, "CONFIRMAR", color(0, 255, 150));
}

function guardarPuntaje() {
  if (nombreJugador.trim() === "") nombreJugador = "AAA";
  nombresRanking.push(nombreJugador); puntajesRanking.push(manzanasObtenidas);
  for (let i = 0; i < puntajesRanking.length; i++) {
    for (let j = i+1; j < puntajesRanking.length; j++) {
      if (puntajesRanking[i] < puntajesRanking[j]) {
        let tp = puntajesRanking[i]; puntajesRanking[i] = puntajesRanking[j]; puntajesRanking[j] = tp;
        let tn = nombresRanking[i]; nombresRanking[i] = nombresRanking[j]; nombresRanking[j] = tn;
      }
    }
  }
  nombreJugador = "";
}

function crearSpray(x, y) {
  particulas = [];
  for (let i = 0; i < 40; i++) {
    particulas.push({
      pos: createVector(x, y),
      vel: p5.Vector.random2D().mult(random(2, 4)),
      vida: random(20, 40),
      c: coloresSpray[i % 3]
    });
  }
  mostrarSpray = true; tiempoSpray = 40;
}

function actualizarParticulas() {
  for (let i = particulas.length - 1; i >= 0; i--) {
    let p = particulas[i];
    p.pos.add(p.vel); p.vida--;
    fill(p.c); noStroke(); ellipse(p.pos.x, p.pos.y, 4);
    if (p.vida <= 0) particulas.splice(i, 1);
  }
}
