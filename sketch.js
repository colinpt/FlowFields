let r = 0;
let theta = 0;
let canvasToggle = false;
let currentCanvas;
let sGrid, flowGrid;
let dx, dy, w, h;
let settings;
let startDraw = false;
let previousQuery = ""
let settingsAreOpen = false;
let override = false;
let showSections = false;
//****************************************
const fetchOptions = {method: 'GET', redirect: 'follow'};

function setup() {
  angleMode(DEGREES);
}

async function generate(){
  startDraw = true;
  query = document.getElementById("query").value;
  override = document.getElementById("override").checked;
  showSections = document.getElementById("showSections").checked;
  if (override) {
    weatherJSON = populateSettingsViaManualInput()
    settings = populateSettingsViaWeather(weatherJSON);
  } 
  else
  {
    previousQuery = query
    weatherResponse = await fetch(`http://api.weatherapi.com/v1/current.json?key=a37179c22caf458aa10220836220102&q=${query}`, fetchOptions)
    weatherJSON = await weatherResponse.json();
    settings = populateSettingsViaWeather(weatherJSON);
    console.log(weatherJSON);
  }

  populateTableWithSettings(weatherJSON, settings);
  console.log(settings);

  currentCanvas = createCanvas(windowWidth, windowHeight);
  dx = windowWidth * settings.resolution;
  dy = windowHeight * settings.resolution;
  w = floor(windowWidth / dx);
  h = floor(windowHeight / dy);

  sGrid = getSectionedGrid(w, h, settings);
  
  if(!showSections) {
    background(getRandomColorString(settings, {h:0, s:0, b:map(settings.time, -1, 1, -20, 5)}));
    flowGrid = generateFlowFieldsOnGrid(w, h, sGrid, settings);
  }
  loop(); 


}

function draw() {
  let x = y = 0;
  noLoop();
  noStroke();
  if(!showSections){
    fill(0);
    if (startDraw){
      
      noFill();
      
      strokeWeight(1);
      for (i = 0; i < settings.line.density; i++){
        dl = ceil(random(-settings.line.variance, settings.line.variance));
        l = ceil((settings.line.baseLength + dl));
        x = xi = random(0,w * dx);
        y = yi = random(0,h * dy);
        stroke(getRandomColorString(settings, {h:0,s:0,b:0}));
        //Simulate particle going in both directions
        for(k = 0; k < 2; k++){
          beginShape();
          for(j = 0; j < l; j++){
            //Check boundries
            if (x > w * dx || x < 0 || y > h * dy || y < 0) continue;         
            vertex(x,y);
            theta = flowGrid[floor(x / dx)][floor(y / dy)]
            if (k == 0){
              x += dx * cos(theta);
              y += dy * sin(theta);
            } else {
              x += dx * -cos(theta);
              y += dy * -sin(theta);
            }
          }
          endShape();
          x = xi
          y = yi
        }  
      }

      console.log('Done');
    }
  } else {
    for(i = 0; i < sGrid.length; i++){
      for(j = 0; j < sGrid[i].length; j++){
        a = map(sGrid[i][j], 0, settings.sectionCount, 0, 255);
        fill(a);
        rect(x,y,dx,dy);
        y += dy;
      }
      y = 0;
      x += dx;
    }
  }
}

function getSectionedGrid(w, h, settings){
  let sectionedGrid = new Array(w);
  highest = 0;
  for(x = 0; x < w; x++){
    sectionedGrid[x] = new Array(h);
    for(y = 0; y < h; y++){
      alpha = 0;
      for(i = 0; i < settings.sectionCount; i++){
        alpha += 100 * noise(x * settings.sections[i].res.x, y * settings.sections[i].res.y, settings.sections[i].seed);
      }
      alpha /= settings.sectionCount
      alpha %= settings.sectionCount

      sectionedGrid[x][y] = floor(alpha);
    }
    
  }
  return sectionedGrid
}

function generateFlowFieldsOnGrid(w, h, sGrid, settings){
  let flowGrid = new Array(w);
  for(x = 0; x < w; x++){
    flowGrid[x] = new Array(h);
    for(y = 0; y < h; y++){
       index = sGrid[x][y]
       theta = noise(x * settings.sections[index].flowIntesity.x, y * settings.sections[index].flowIntesity.y, settings.sections[index].seed);
       flowGrid[x][y] = map(theta, 0, 1, settings.baseAngle -90, settings.baseAngle  + 90) + ((sGrid[x][y]) * ((-1) ** sGrid[x][y]) * 30)
    }
  }
  return flowGrid;
}

   //Show flow field
    // x = y = 0;
    // stroke(255,0,0);
    // for(i = 0; i < flowGrid.length; i++){
    //   for(j = 0; j < flowGrid[i].length; j++){
    //     theta = flowGrid[i][j]; 
    //     line(x, y, x + (dx * cos(theta)), y + (dy * sin(theta)));
    //     y += dy;
    //   }
    //   y = 0;
    //   x += dx;
    // }

function getRandomColorString(s, offset){
  hue = round(random(s.color.h.lower, s.color.h.upper) + offset.h) % 360;
  saturation = constrain(round(random(s.color.s.lower, s.color.s.upper) + offset.s), 0, 100);
  brightness = constrain(round(random(s.color.b.lower, s.color.b.upper) + offset.b), 0, 100);
  return `hsb(${hue},${saturation}%,${brightness}%)`
}

function populateSettingsViaManualInput(){
  console.log(document.getElementById('wCondition').value, typeof document.getElementById('wCondition').value)
  manualWeather = {
    current: {
      condition: {
        code: Number(document.getElementById('wCondition').value)
      },
      precip_mm: constrain(document.getElementById('wPrecipitation').value, 0, 10),
      cloud: constrain(document.getElementById('wCloudCover').value, 0, 100),
      gust_kph: constrain(document.getElementById('wWindSpeed').value, 0, 100),
      temp_f: constrain(document.getElementById('wTemp').value, -50, 120),
      wind_degree: constrain(document.getElementById('wWindDirection').value, 0, 360),
      humidity: 0,
      vis_km: 0
    },
    location: {
      localtime: constrain(document.getElementById('wTime').value, 0, 24)
    }
  };

  return manualWeather;
}

function populateTableWithSettings(weather, settings){
  time = weather.location.localtime;
  document.getElementById('wCondition').value = weather.current.condition.code
  document.getElementById('wPrecipitation').value = weather.current.precip_mm
  document.getElementById('wCloudCover').value = weather.current.cloud
  document.getElementById('wWindSpeed').value = weather.current.gust_kph
  document.getElementById('wTemp').value = weather.current.temp_f
  document.getElementById('wWindDirection').value = weather.current.wind_degree
  document.getElementById('wTime').value = (typeof time === 'string' || time instanceof String) ? hour = time.split(" ")[1].split(":")[0] : hour = time;
}

function toggleSettingsTable(){
  if (settingsAreOpen){
    document.getElementById("settings").style.display = "none"
    settingsAreOpen = false;
  } else {
    document.getElementById("settings").style.display = ""
    settingsAreOpen = true;
  }
}

function reset(){

}

function saveCanvas() {
  save("flowField.jpg");
}