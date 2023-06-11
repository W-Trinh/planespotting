function inside_polygon(point, vs, draw=false) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
    
    var x = point[0], y = point[1];
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];
        
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

function polygon_rect_boundaries(polygon, draw=false, debug=false) {
    let max_x = -2000
    let min_x =  2000
    let max_y =  2000
    let min_y = -2000
    for (const vertex of polygon) {
        //if (draw) L.marker([vertex[1], vertex[0]]).addTo(map).bindTooltip("x : " + point[0] + " | y : " + point[1])
        if (vertex[0] > max_x) {
            max_x = vertex[0]
        }
        if (vertex[0] < min_x) {
            min_x = vertex[0]
        }
        if (vertex[1] < max_y) {
            max_y = vertex[1]
        }
        if (vertex[1] > min_y) {
            min_y = vertex[1]
        }
    }
    if (draw) L.polygon([[max_y,min_x],[max_y,max_x],[min_y,max_x],[min_y,min_x]], {color: 'red'}).addTo(map)

    return {"max_x": max_x, "min_x": min_x, "max_y": max_y, "min_y": min_y}
}

function generate_grid_of_points_in_boundaries(boundaries, precision = 5, draw=false, debug=false) {
    let points = []
    let vertical_step   = (boundaries["max_x"] - boundaries["min_x"]) / precision
    let horizontal_step = (boundaries["max_y"] - boundaries["min_y"]) / precision
    for (let i = 0; i <= precision; i++) {
        for (let j = 0; j <= precision; j++) {
            points.push(
                [
                    boundaries["min_x"] + vertical_step*i,
                    boundaries["min_y"] + horizontal_step*j
                ]
            )
            
        }
    }
    return points
}

function remove_points_outside_polygon_boundaries(points, polygon, draw=false, debug=false) {
    let points_inside_polygon = []
    //console.log("polygone : ", polygon)
    for (const point of points) {
        if (inside_polygon(point, polygon)) {
            points_inside_polygon.push(point)
            if (draw) L.circle([point[1], point[0]], 1).addTo(map);
        } 
    }
    return points_inside_polygon
}

function closest_point_to_center(points, boundaries, draw=false, debug=false) {
    let center = [
        boundaries["min_x"] + (boundaries["max_x"] - boundaries["min_x"]) / 2, 
        boundaries["min_y"] + (boundaries["max_y"] - boundaries["min_y"]) / 2
    ]
    //console.log(center)
    if (draw) L.circle([center[1], center[0]], 3, {color:'yellow'}).addTo(map);
    let most_centered_point_yet = points[0]
    let smallest_distance_yet = 100000
    for (const point of points) {
        let dist = distance(center, point)
        if (dist < smallest_distance_yet) {
            most_centered_point_yet = point
            smallest_distance_yet   = dist
        }
    }
    if (draw) L.circle([most_centered_point_yet[1], most_centered_point_yet[0]], 3).addTo(map);
    return most_centered_point_yet
}

async function request_altitudes(points, draw=false, debug=false) {
    const chunkSize = 100;
    let Promises_responses = 0
    let alts = []
    let chunks = []
    for (let i = 0; i < points.length; i += chunkSize) {
        chunks.push(points.slice(i, i + chunkSize))
    }

    for (const chunk of chunks) {
        let lats = chunk.map((x) => x[0]).join('|') 
        let lons = chunk.map((x) => x[1]).join('|')
        fetch('https://wxs.ign.fr/calcul/alti/rest/elevation.json?sampling=100&lon='+ lats + '&lat='+ lons +'&indent=true')
                .then( response => response.json() )
                .then( data => 
                    {
                        Promises_responses++

                        for (const value of data["elevations"]) {
                            var alti = parseFloat(value["z"])
                            alts.push(alti)
                            //console.log(alti)
                        }
                    }
                ).catch( (err) => {
                        Promises_responses++
                        //console.log(err, " nombres de points : ", chunk.length)
                    }
                )
    }
    
    //on attend toutes les réponses
    let waited_for = 0
    while( Promises_responses < chunks.length && waited_for <= MAX_LOOP_ALLOWED ) {
        waited_for++
        await sleep(200)
    }
    return alts
}

async function get_average_altitude_of_polygon(polygon, draw=false, debug=false) {
        if (!("geo_shape" in polygon.fields) ) return polygon.fields.geo_point_2d
        
        let sampled_points = []
        let center = []

        for (const sub_poly of polygon.fields.geo_shape.coordinates[0]) {
            let prb   = polygon_rect_boundaries(sub_poly, draw=false)

            let gopib = generate_grid_of_points_in_boundaries(prb, 6)
            let rpopb = remove_points_outside_polygon_boundaries(gopib, sub_poly)

            //retente avec plus de précision 1 fois
            if (rpopb.length == 0) {
                gopib = generate_grid_of_points_in_boundaries(prb, 10)
                rpopb = remove_points_outside_polygon_boundaries(gopib, sub_poly)
            }

            //console.log(rpopb)
            if (rpopb.length > 0) center = closest_point_to_center(rpopb, prb, draw=false) 

            sampled_points = sampled_points.concat(rpopb)
        }

        if (sampled_points.length == 0) {
            sampled_points = [polygon.fields.geo_point_2d]
            center = polygon.fields.geo_point_2d
        }

        //console.log(sampled_points)
        let re = await request_altitudes(sampled_points)
        //console.log(re)
        let average_altitude = (re.reduce((a, b) => a + b, 0) / re.length).toFixed(2)
        //console.log("moyenne alti : ", average_altitude, "m")
        //marker = L.marker([center[1], center[0]]).addTo(map)
        //marker.bindPopup("<b>altitude moyenne de "+average_altitude+"m</b>")

        return {average_altitude: average_altitude, sampled_points:sampled_points, center:center}
    //}
}
