//helpers
const eps = 0.0000001;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function load_from_json(path) {
    elevation_dataset = []
    fetch(path)
        .then ( (response) => response.json()             )
        .then ( (data) => elevation_dataset.push(...data) )
        .catch( (err) => console.log(err)                 )
    console.log(elevation_dataset)
}

function download(content, fileName, contentType='application/json') {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function onDownload() {
    download(JSON.stringify(elevation_dataset), "toulouse_elevation_data.json", "text/plain");
    download(JSON.stringify(index_error_503  ), "index_fails.json"            , "text/plain");
}

function distance(p1, p2) {return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));}

function percent_on_range(value, min_bound, max_bound) { 
    return parseInt(Math.floor(((value - min_bound) * 100) / (max_bound - min_bound)))
}

function update_max_min_alt(alt, min_alt, max_alt) {
    if (alt > max_alt && alt < 9999 ) {max_alt = alt}
    else if (alt < min_alt && alt > 0) {min_alt = alt}
    return [min_alt, max_alt]
}

function add_label_on_map(point, label, layer) {
    var marker = new L.marker([point[0],point[1]], { opacity: 0.01 }); //opacity may be set to zero
    marker.bindTooltip(label, {permanent: true, className: "my-label", offset: [0, 0] });
    marker.addTo(mrkr_lbl);
}

function add_marker_on_map(point, layer) {
    if (isNaN(point[0]) || isNaN(point[1])) return
    return new L.marker(point, { opacity: 1 }).addTo(layer);
}

function add_polyline_on_map(points, layer, param={color:'yellow', opacity: 1.0}) {
    return L.polyline(points, param).addTo(layer);
}

function distance_between_points(p1, p2) {
    const earthRadius = 6371; // Radius of the Earth in kilometers

    // Convert latitude and longitude from degrees to radians
    const lat1Rad = toRadians(p1[0]);
    const lon1Rad = toRadians(p1[1]);
    const lat2Rad = toRadians(p2[0]);
    const lon2Rad = toRadians(p2[1]);

    // Calculate the differences between the coordinates
    const latDiff = lat2Rad - lat1Rad;
    const lonDiff = lon2Rad - lon1Rad;

    // Calculate the distance using the Haversine formula
    const a =
        Math.sin(latDiff / 2) ** 2 +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(lonDiff / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    return distance;
}

function increase_flight_path_sub_divisions(path, precision) {
    let sub_divisions = []
    for (let k = 0; k < path.length-1; k++) {
        let startX = path[k][0]
        let startY = path[k][1]
        let endX   = path[k+1][0]
        let endY   = path[k+1][1]
        // Calculate the slope (m) and y-intercept (b) of the line
        const slope = (endY - startY) / (endX - startX);
        const yIntercept = startY - slope * startX;

        // Calculate the increment value for the x-coordinate
        const increment = (endX - startX) / (precision - 1);

        // Generate points along the line 
        for (let i = 0; i < precision; i++) {
            const x = startX + i * increment;
            const y = slope * x + yIntercept;
            if (isNaN(x) || isNaN(y)) continue
            sub_divisions.push([x, y]);
        }
    }
    return sub_divisions
}

function rotate_segment(segment, angle) {
    // Convert the angle from degrees to radians
    var angleRad = angle * Math.PI / 180;

    // Translate the start point to the origin
    var translatedEnd = [segment[1][0] - segment[0][0], segment[1][1] - segment[0][1]];

    // Apply the rotation transformation using the rotation matrix
    var rotatedEndX = translatedEnd[0] * Math.cos(angleRad) - translatedEnd[1] * Math.sin(angleRad);
    var rotatedEndY = translatedEnd[0] * Math.sin(angleRad) + translatedEnd[1] * Math.cos(angleRad);

    // Translate the rotated point back to its original position
    var rotatedEnd = [rotatedEndX + segment[0][0], rotatedEndY + segment[0][1]];

    return [[segment[0][0],segment[0][1]],rotatedEnd];
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function convert_segment_length(segment, current, target) {
    // Calculate the scaling factor
    const scale = parseFloat(target / current);

    if (isNaN(scale)) console.log("sale merde")
  
    // Calculate the new coordinates
    const startX = segment[0][0];
    const startY = segment[0][1];
    const endX = parseFloat(startX) + (segment[1][0] - startX) * scale;
    const endY = parseFloat(startY) + (segment[1][1] - startY) * scale;
  
    if (isNaN(endX) || isNaN(endY)) return -1
    // Return the new segment
    return [[startX,startY],[endX,endY]]
  }

function get_probs_from_flight_path(path, angle, size) {
    let probes = []
    for (let k = 0; k < path.length-1; k++) {
        //limit size of probe
        let seg = [path[k],path[k+1]]
        let seg_resized = convert_segment_length(seg, distance_between_points(seg[0], seg[1]), size*1000)

        if (seg_resized === -1) continue

        let pos_prob = rotate_segment(seg_resized,  angle)
        let neg_prob = rotate_segment(seg_resized, -angle)
        //probes.push(normalized_neg_prob, normalized_pos_prob)
        probes.push(pos_prob, neg_prob)
    }
    return probes
}

function isLineCrossingPolygon(line, polygon) {
    for (let i = 0; i < polygon.length-1; i++) {
        if(segment_intersection([polygon[i],polygon[i+1]],line)) return true
        //if(segment_intersection(line,[polygon[i],polygon[i+1]])) return true
    }
    if(segment_intersection([polygon[polygon.length-1],polygon[0]],line)) return true
    //if(segment_intersection(line,[polygon[polygon.length-1],polygon[0]])) return true
    
    return false;
}

const between = (a, b, c) => a - eps <= b && b <= c + eps;
const segment_intersection = (l1, l2) => {
    let x1 = l1[0][0]
    let y1 = l1[0][1]
    let x2 = l1[1][0]
    let y2 = l1[1][1]
    let x3 = l2[0][0]
    let y3 = l2[0][1]
    let x4 = l2[1][0]
    let y4 = l2[1][1]

    var x = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));

    var y = ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));

    if(
        (isNaN(x) || isNaN(y)) ||
        (x1>=x2 && !between(x2, x, x1) || !between(x1, x, x2)) ||
        (y1>=y2 && !between(y2, y, y1) || !between(y1, y, y2)) ||
        (x3>=x4 && !between(x4, x, x3) || !between(x3, x, x4)) ||
        (y3>=y4 && !between(y4, y, y3) || !between(y3, y, y4))
    ) {
        return false;
    }

    return true;

};

function line_circle_intersection(obj1, obj2){
    // let inside1 = point_circle(new Point(obj1.p1.x, obj1.p1.y), obj2)
    // let inside2 = point_circle(new Point(obj1.p2.x, obj1.p2.y), obj2)

    // if (inside1 || inside2) return true
    

    let distX = obj1.x - obj1.x1
    let distY = obj1.y - obj1.y1
    let len = Math.sqrt( (distX*distX) + (distY*distY) )

    let dot = ( ((obj2.x-obj1.x)*(obj1.x1-obj1.x)) + ((obj2.y-obj1.y)*(obj1.y1-obj1.y)) ) / Math.pow(len,2)

    let closestX = obj1.x + (dot * (obj1.x1-obj1.x))
    let closestY = obj1.y + (dot * (obj1.y1-obj1.y))

    let onSegment = point_line(new Point(closestX, closestY), obj1)

    if (!onSegment) return false

    distX = closestX - obj2.x;
    distY = closestY - obj2.y;
    let distance = Math.sqrt( (distX*distX) + (distY*distY) );

    if (distance <= r) {
        return true;
    }
    return false;
}

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