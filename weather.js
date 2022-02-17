function populateSettingsViaWeather(weather){
    settings = {sections: []};

    settings.chaosModifier = 0.05;
    //settings.resolution = mapPressureToResolution(weather.current.pressure_mb)
    settings.resolution = 0.001
    settings.sectionCount = mapConditionToSectionCount(weather.current.condition.code);
    // settings.chaosModifier += mapSOMETHINGToChaosModifier();
    settings.line = mapPrecipitationToLineLengthAndDensity(weather.current.precip_mm);
    settings.chanceOfLightning = mapConditionToPossiblyOfLightning(weather.current.condition.code);
    settings.baseAngle = weather.current.wind_degree % 360
    settings.time = mapTimeValue(weather.location.localtime)
    settings.color = mapTimeAndTempToColorRangeHSB(settings.time, weather.current.temp_f)
    
    for (i = 0; i < settings.sectionCount; i++){
        settings.sections[i] = 
            {
                seed: random(0,10000),
                res: mapCloudCoverToResolutionScaling(weather.current.cloud, settings.chaosModifier),
                flowIntesity: mapWindSpeedToFlowScaling(weather.current.gust_kph, i),
            }
    }
    
    

    return settings
}

function mapTimeValue(time){
    if (typeof time === 'string' || time instanceof String) {
        hour = time.split(" ")[1].split(":")[0];
    } else {
        hour = constrain(time, 0, 24);
    }

    return sin((180 * (hour - 6)) / 12)
}

function mapTimeAndTempToColorRangeHSB(time, temp){

    temp = constrain(temp, -50, 140);

    colorTemp = normalizeTemp(temp);
    console.log(colorTemp);
    

    hue = getHueFromTempCW(-1 * colorTemp);
    saturation = getSaturationFromTempCW(colorTemp);
    brightness = map(time, -1, 1, 65, 80);

    colorRange = 
    {
        h: {
            lower: constrain(hue - 25, 0, 240),
            upper: constrain(hue + 25, 0, 240)
        }, 
        s: {
            lower: saturation - 5,
            upper: saturation + 5
        }, 
        b: {
            lower: brightness - 10,
            upper: brightness + 20
        }
    }

return colorRange

}

function normalizeTemp(x){
    //https://www.desmos.com/calculator/upxirybnro
    return 2 * (1 / (1 + exp(-0.05 * (x - 60)))) - 1
}

function getHueFromTempCW(x){
    if (x < -0.2){
        y = (75 * x) + 75;
    } 
    else if (x > 0.2){
        y = (75 * x) + 165;
    } 
    else {
        y = (625 * (x ** 2)) + (300 * x) + 95;
    }
    return y;
}

function getSaturationFromTempCW(x){
    //Drops saturation to 60 at 0
    //https://www.desmos.com/calculator/pzhn50llps
    return abs((80/(1 + exp(-20 * x))) - 40) + 60
}

function mapCloudCoverToResolutionScaling(cloudCover, chaos){
    scaling = {x: 0, y: 0};
    cMod = 100 * chaos;
    scaling.x = map(random(cloudCover - cMod, cloudCover + cMod), -25, 125, 0.000005, 0.0015);
    scaling.y = map(random(cloudCover - cMod, cloudCover + cMod), -25, 125, 0.000005, 0.0015);
    return scaling
}

function mapHumidityToLineWeightRange(humidity, chaos){
    return round(map(humidity, 0, 100, 1, 4));
}

function mapVisibilityToLineWeightFrequency(visibility, chaos){
    frequency = 10

    return frequency
}

function mapPressureToResolution(pressure){
    p = pressure + random(-25,25);
    return map(pressure, 900, 1100, 0.005, 0.0005)
}

function mapPrecipitationToLineLengthAndDensity(precipitation){
    p = constrain(precipitation, 0, 3)
    line = {
        density: map(p, 0, 3, 20000, 75000), 
        variance: map(p, 0, 3, 100, 3),
        baseLength: map(p, 0, 3, 150, 10),
    };
    return line;
}

function mapWindSpeedToFlowScaling(windSpeed, sectionNumber){
    scaling = {x: 0, y: 0};
    multiplier = ((sectionNumber % 3) / 2) + 0.5
    scaling.x = map(windSpeed + random(-10, 10), -10, 120, 0.00005, 0.15) * multiplier;
    scaling.y = map(windSpeed + random(-10, 10), -10, 120, 0.00005, 0.15) * multiplier;
    return scaling
}

function mapSOMETHINGToChaosModifier(){

}

function mapConditionToPossiblyOfLightning(condition){
    //https://www.weatherapi.com/docs/weather_conditions.json
    switch(condition){
        case (1276 || 1282): // Moderate or heavy rain with thunder, Moderate or heavy snow with thunder
            return 0.01
        case (1279 || 1273): // Patchy light snow with thunder, Patchy light rain with thunder"
            return 0.0075
        case (1087): // Thundery outbreaks possible
            return 0.005
        default:
            return 0
    }
}

function mapConditionToSectionCount(condition){
    //https://www.weatherapi.com/docs/weather_conditions.json
    switch(condition){
        case (1000): // Clear
            return 3
        case (1003 || 1009): // Partly cloudy, Overcast
            return 4
        case (1006): // Cloudy
            return 5
        case (1279 || 1273): // Patchy light snow with thunder, Patchy light rain with thunder"
            return 6
        case (1276 || 1282): // Moderate or heavy rain with thunder, Moderate or heavy snow with thunder
            return 7
        default:
            return 3
    }
}