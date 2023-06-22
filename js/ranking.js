function rank_green_space_based_on_flight_path(
    flight_path_lower_bound, flight_path_higher_bound,
    green_space_altitude_lower_bound, green_space_altitude_higher_bound,
    distance_between_green_space_and_flight_lower_bound, distance_between_green_space_and_flight_higher_bound,
    angle_between_green_space_and_flight_lower_bound, angle_between_green_space_and_flight_higher_bound,
    precision=5 ) {

    let scores = {}

    for (const green_space of GREEN_SPACES) {
        if (green_space.center_most_point === undefined    ) continue
        if (green_space.avg_altitude <= green_space_altitude_lower_bound ||
            green_space.avg_altitude >= green_space_altitude_higher_bound ) continue

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
                            if(GREEN_SPACES_RANKS[green_space.green_space.recordid] !== null) {
                                GREEN_SPACES_RANKS[green_space.green_space.recordid].flight_path_count_score += 1
                            } else {
                                GREEN_SPACES_RANKS[green_space.green_space.recordid].flight_path_count_score =  1
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
}

function rank_green_spaces_based_on_population_density(){
    let green_spaces  = GREEN_SPACES
    let neighborhoods = NEIGHBORHOODS
    let scores = {}
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
                        //L.marker(actualCenter).bindPopup("Note :" + note + "/100").addTo(map)
                        GREEN_SPACES_RANKS[park.green_space.recordid].population_density_score = note
                    }
                }
                catch{
                    //console.log("ccasé")
                }
            })
        }
    })
}

function final_score_evaluation(evaluation_method="") {
    let eval_function = null
    switch (evaluation_method) {
        case "I_hate_buildings":
            eval_function = (value) => value["flight_path_count_score"]*value["population_density_score"]
            console.log("here")
            break;
    
        default:
            eval_function = (value) => value["flight_path_count_score"]-value["population_density_score"]/100
            console.log("there")
            break;
    }

    apply_to_dict(GREEN_SPACES_RANKS, (value) => {
        return {
            flight_path_count_score: value["flight_path_count_score"],
            population_density_score: value["population_density_score"],
            final_score: eval_function(value)
        }
    })
}

function show_best_green_spaces(n) {
    // BEST_GREEN_SPACES_MARKERS.forEach(x => {
        
    // })

    BEST_GREEN_SPACES_MARKERS.forEach((value, index, array) => {
        rank_lyr.removeLayer(value)
        delete BEST_GREEN_SPACES_MARKERS[index]
    })

    var filtered = Object.assign({}, ...
        Object.entries(GREEN_SPACES_RANKS).filter(([k,v]) => v["final_score"]>1).map(([k,v]) => ({[k]:v["final_score"]}))
    );
    let sorted_scores = Object.entries(filtered).sort((x, y) => x[1] - y[1]);

    //console.log(sorted_scores)

    sorted_scores = sorted_scores.slice(-n-1, -1)

    for (const id_score of sorted_scores) {
        for (const green_space of GREEN_SPACES) {
            if (green_space.center_most_point === undefined    ) continue
            if (green_space.green_space.fields.surface_m2 < 100) continue

            let lat = Math.min(green_space.center_most_point[1], green_space.center_most_point[0])
            let lon = Math.max(green_space.center_most_point[1], green_space.center_most_point[0])
            let gs_center = [lon, lat]
            if( id_score[0] === green_space.green_space.recordid) {
                BEST_GREEN_SPACES_MARKERS.push(add_marker_on_map(gs_center, rank_lyr))
            }
        }
    }
}
