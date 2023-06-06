const Gradient = {
    inputA : '',
    inputB : '',
    inputC : '',
    gradientElement : '',
    
    // Convert a hex color to an RGB array e.g. [r,g,b]
    // Accepts the following formats: FFF, FFFFFF, #FFF, #FFFFFF
    hexToRgb : function(hex){
        var r, g, b, parts;
        // Remove the hash if given
        hex = hex.replace('#', '');
        // If invalid code given return white
        if(hex.length !== 3 && hex.length !== 6){
            return [255,255,255];
        }
        // Double up charaters if only three suplied
        if(hex.length == 3){
            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        }
        // Convert to [r,g,b] array
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);

        return [r,g,b];
    },
    
    // Converts an RGB color array e.g. [255,255,255] into a hexidecimal color value e.g. 'FFFFFF'
    rgbToHex : function(color){
        // Set boundries of upper 255 and lower 0
        color[0] = (color[0] > 255) ? 255 : (color[0] < 0) ? 0 : color[0];
        color[1] = (color[1] > 255) ? 255 : (color[1] < 0) ? 0 : color[1];
        color[2] = (color[2] > 255) ? 255 : (color[2] < 0) ? 0 : color[2];
        
        return this.zeroFill(color[0].toString(16), 2) + this.zeroFill(color[1].toString(16), 2) + this.zeroFill(color[2].toString(16), 2);
    },
    
    // Pads a number with specified number of leading zeroes
    zeroFill : function( number, width ){
        width -= number.toString().length;
        if ( width > 0 ){
            return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
        }
        return number;
    },

    // Generates an array of color values in sequence from 'colorA' to 'colorB' using the specified number of steps
    generate : function(colorA, colorB, steps){
        var result = [], rInterval, gInterval, bInterval;
        
        colorA = this.hexToRgb(colorA); // [r,g,b]
        colorB = this.hexToRgb(colorB); // [r,g,b]
        steps -= 1; // Reduce the steps by one because we're including the first item manually
        
        // Calculate the intervals for each color
        rStep = ( Math.max(colorA[0], colorB[0]) - Math.min(colorA[0], colorB[0]) ) / steps;
        gStep = ( Math.max(colorA[1], colorB[1]) - Math.min(colorA[1], colorB[1]) ) / steps;
        bStep = ( Math.max(colorA[2], colorB[2]) - Math.min(colorA[2], colorB[2]) ) / steps;
    
        result.push( '#'+this.rgbToHex(colorA) );
        
        // Set the starting value as the first color value
        var rVal = colorA[0],
            gVal = colorA[1],
            bVal = colorA[2];
    
        // Loop over the steps-1 because we're includeing the last value manually to ensure it's accurate
        for (var i = 0; i < (steps-1); i++) {
            // If the first value is lower than the last - increment up otherwise increment down
            rVal = (colorA[0] < colorB[0]) ? rVal + Math.round(rStep) : rVal - Math.round(rStep);
            gVal = (colorA[1] < colorB[1]) ? gVal + Math.round(gStep) : gVal - Math.round(gStep);
            bVal = (colorA[2] < colorB[2]) ? bVal + Math.round(bStep) : bVal - Math.round(bStep);
            result.push( '#'+this.rgbToHex([rVal, gVal, bVal]) );
        };
        
        result.push( '#'+this.rgbToHex(colorB) );
        
        return result;
    },
    
    render : function(colorA, colorB, list){
        var list = (typeof list === 'object') ? list : document.querySelector(list);
        
        var listItems = list.children,
            steps  = listItems.length,
            colors = Gradient.generate(colorA, colorB, steps);

        for (var i = 0; i < listItems.length; i++) {
            var item = listItems[i];
            item.style.backgroundColor = colors[i];
        };
    }
}

var gradient = Gradient.generate("#40FF33","#FF3333",100);

async function getQuartier() {
    const response = await fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=recensement-population-2019-grands-quartiers-population&q=&rows=61');
    const myJson = await response.json(); 

    const data = [];

    myJson["records"].forEach(quartier =>{
            const poly = []
            for (const tabPoint of quartier["fields"]["geo_shape"]["coordinates"]){
                for (const point of tabPoint){
                    const np = []
                    np.push(point[1],point[0])
                    poly.push(np)
                }
            }

            data.push({
                "quartier": quartier["fields"]["lib_grd_quart"],
                "population": Math.floor(quartier["fields"]["p19_pop"]),
                "point":quartier["fields"]["geo_point_2d"],
                "polygon":poly,
            })
        }
    )

    return data
}

async function placeQuartier(){
    const data = await getQuartier()
    const min = 1000
    const max = 18000

    data.forEach(quartier =>{
        var percent = ( ( ( (quartier["population"] - min) * 100 ) / (max - min) ) );

        poly = L.polygon(quartier["polygon"],{color: gradient[ Math.floor(percent-1) ]}).bindPopup(quartier["quartier"] + " : " + quartier["population"]).addTo(map);
    }
    )
}