async function collect_flights() {
    let lat_min = 43.533860
    let lat_max = 43.666128
    let lon_min = 1.316002
    let lon_max = 1.555642
    L.polygon([[lat_max,lon_min],[lat_max,lon_max],[lat_min,lon_max],[lat_min,lon_min]], {color: 'red'}).addTo(flgt_pos)
    let headers = new Headers();
    let loop_since_last_download = 0
    headers.set('Authorization', 'Basic ' + btoa("Chriceratops" + ":" + "402SiGf#OPENSKY"));
    //headers.set('Authorization', 'Basic ' + btoa("Chriceradeux" + ":" + "402SiGf#OPENSKY"));

    while(true) {
        console.log("état requete flights :",keep_collecting_flights)

        await sleep(1000*10) //10 seconds
        if (!keep_collecting_flights) continue

        console.log("calling opensky api")
        await fetch(`https://opensky-network.org/api/states/all?lamin=${lat_min}&lamax=${lat_max}&lomin=${lon_min}&lomax=${lon_max}`, {method:'GET', headers: headers})
            .then(res => res.json())
            .then(vectors => {
                console.log(vectors)
                toggle_alerte(false)
                if (vectors["states"] !== null) {
                    vectors["states"].forEach((vector, index, array) => {
                        let icao24    = vector[0]
                        let call_sign = vector[1]
                        let longitude = vector[5]    
                        let latitude  = vector[6]
                        let altitude  = vector[7]
                        let on_ground = vector[8]
                        let category  = vector[17]
                        let point     = [latitude,longitude,altitude]

                        if (icao24 in FLIGHTS) {
                            FLIGHTS[icao24]["positions"].push(point)
                            DRAWED_FLIGHTS[icao24].remove()
                            let points = FLIGHTS[icao24]["positions"].map(triplet => [triplet[0], triplet[1]])
                            DRAWED_FLIGHTS[icao24] = add_polyline_on_map(points, flgt_pth)
                        } else {
                            FLIGHTS[icao24] = {
                                icao24    : icao24,
                                call_sign : call_sign,
                                on_ground : on_ground,
                                category  : category,
                                positions : [point]
                            }
                            let points = FLIGHTS[icao24]["positions"].map(triplet => [triplet[0], triplet[1]])
                            DRAWED_FLIGHTS[icao24] = add_polyline_on_map(points, flgt_pth)
                        }
                        if(!on_ground) {
                            add_marker_on_map(point, flgt_pos)
                        }
                    })
                }
            })
            .catch( e => {console.log(e); toggle_alerte(true)})

            loop_since_last_download++
            if (loop_since_last_download >= 10) {
                download(JSON.stringify(FLIGHTS), FILE_NAME_FLIGHTS, "text/plain");
                loop_since_last_download = 0
            }
    }
}

async function draw_flights() {
    for (const icao24 in FLIGHTS) {
        let points = FLIGHTS[icao24]["positions"].map(triplet => [triplet[0], triplet[1]])
        DRAWED_FLIGHTS[icao24] = add_polyline_on_map(points, flgt_pth)
    }
}

async function draw_probes_of() {
    let cpt = -1
    for (const icao24 in FLIGHTS) {
        cpt++
        console.log("yo")

        let points = FLIGHTS[icao24]["positions"].map(triplet => [triplet[0], triplet[1]])

        let precision = 5
        let distance  = 1500

        let sub_divs = increase_flight_path_sub_divisions(points, precision)

        for (const sub_div of sub_divs) {
            for (const green_space of GREEN_SPACES) {
            
                if (green_space.green_space.fields.surface_m2 > 100) {
                    try {
                        //console.log(green_space.center_most_point)
                        //add_marker_on_map(green_space.center_most_point, flgt_prb)
                        let lat = Math.min(green_space.center_most_point[1], green_space.center_most_point[0])
                        let lon = Math.max(green_space.center_most_point[1], green_space.center_most_point[0])
                        let center = [lon, lat]
                        let dist = distance_between_points(center, sub_div)*1000
                        if (dist < distance) {
                            add_polyline_on_map([center, sub_div], flgt_prb, {color: 'red', opacity: 0.2})
                        }
                    } catch (error) {
                        //console.log(error)
                        continue
                    }
                }
            }
        }
    }

    
}

