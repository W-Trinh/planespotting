function rank_green_space_based_on_flight_path(
    flight_path_lower_bound, flight_path_higher_bound,
    green_space_size_lower_bound, green_space_size_higher_bound,
    distance_between_green_space_and_flight_lower_bound, distance_between_green_space_and_flight_higher_bound,
    angle_between_green_space_and_flight_lower_bound, angle_between_green_space_and_flight_higher_bound,
    precision=5 ) {

    let scores = {}

    for (const green_space of GREEN_SPACES) {
        if (green_space.center_most_point === undefined    ) continue
        if (green_space.green_space.fields.surface_m2 >= green_space_size_lower_bound &&
            green_space.green_space.fields.surface_m2 >= green_space_size_higher_bound ) continue

        //console.log(green_space.center_most_point)

        let lat = Math.min(green_space.center_most_point[1], green_space.center_most_point[0])
        let lon = Math.max(green_space.center_most_point[1], green_space.center_most_point[0])
        let gs_center = [lon, lat]

        for (const icao24 in FLIGHTS) {
            let sub_divs = increase_flight_path_sub_divisions(FLIGHTS[icao24]["positions"], precision)
            for (let i = 0; i < sub_divs.length-1; i++) {
            //for (const sub_div of sub_divs) {
                if ( !(sub_divs[i][2] >= flight_path_lower_bound && 
                       sub_divs[i][2] <= flight_path_higher_bound) ) continue
                let point = [sub_divs[i][0], sub_divs[i][1]]
                let next_point = [sub_divs[i+1][0], sub_divs[i+1][1]]
                try {
                    let dist = distance_between_points(gs_center, point)*1000
                    if (dist <= distance_between_green_space_and_flight_higher_bound && 
                        dist >= distance_between_green_space_and_flight_lower_bound) {
                        let angle = toDegrees(find_angle(point, next_point, gs_center))
                        if (angle <= angle_between_green_space_and_flight_higher_bound && 
                            angle >= angle_between_green_space_and_flight_lower_bound) {
                            add_polyline_on_map([gs_center, point], flgt_prb, {color: 'red', opacity: 0.2})
                            if(green_space.green_space.recordid in scores) {
                                scores[green_space.green_space.recordid] += 1
                            } else {
                                scores[green_space.green_space.recordid] =  1
                            }
                            break
                        }
                    }
                } catch (error) {
                    //console.log(error)
                    continue
                }
            }

        }

    }

    console.log(scores)

    let sorted_scores = Object.entries(scores).sort((x, y) => x[1] - y[1]);
    sorted_scores = sorted_scores.slice(-31, -1)

    for (const id_score of sorted_scores) {
        for (const green_space of GREEN_SPACES) {
            if (green_space.center_most_point === undefined    ) continue
            if (green_space.green_space.fields.surface_m2 < 100) continue

            let lat = Math.min(green_space.center_most_point[1], green_space.center_most_point[0])
            let lon = Math.max(green_space.center_most_point[1], green_space.center_most_point[0])
            let gs_center = [lon, lat]
            if( id_score[0] === green_space.green_space.recordid) add_marker_on_map(gs_center, flgt_prb)
        }
    }

    console.log(sorted_scores)
}


function mark_green_spaces(green_spaces, neighborhoods){
    green_spaces.forEach(park => {
        if(park.green_space.fields.surface_m2 > 100){
            neighborhoods.forEach(neighborhood => { 
                try{
                    let lat = Math.min(park.center_most_point[1], park.center_most_point[0])
                    let lon = Math.max(park.center_most_point[1], park.center_most_point[0])
                    const actualCenter = [lon,lat]
                    if(inside_polygon(actualCenter, neighborhood.polygon)) {
                        console.log("--------------TROUVE--------------")
                        const note = Math.floor(100 - (neighborhood.population/31230) * 100)
                        L.marker(actualCenter).bindPopup("Note :" + note + "/100").addTo(map)
                    }
                }
                catch{
                    //console.log("ccasé")
                }
            })
        }
    })
}
