async function collect_flights() {
    let lat_min = 43.533860
    let lat_max = 43.666128
    let lon_min = 1.316002
    let lon_max = 1.555642
    let headers = new Headers();
    headers.set('Authorization', 'Basic ' + btoa("Chriceratops" + ":" + "402SiGf#OPENSKY"));
    
    while(true) {
        console.log("état requete flights :",keep_collecting_flights)

        await sleep(1000*10) //10 seconds
        if (!keep_collecting_flights) continue

        console.log("calling opensky api")
        await fetch(`https://opensky-network.org/api/states/all?lamin=${lat_min}&lamax=${lat_max}&lomin=${lon_min}&lomax=${lon_max}`, {method:'GET', headers: headers})
            .then(res => res.json())
            .then(vectors => {
                toggle_alerte(false)
                console.log(vectors)
                if (vectors["states"] !== null) {
                    vectors["states"].forEach((vector, index, array) => {
                        let icao24    = vector[0]
                        let call_sign = vector[1]
                        let longitude = vector[5]    
                        let latitude  = vector[6]
                        let altitude  = vector[7]
                        let on_ground = vector[8]
                        let category  = vector[17]
                        let point     = [latitude,longitude]

                        if (icao24 in FLIGHTS) {
                            FLIGHTS[icao24]["positions"].push([latitude,longitude])
                            DRAWED_FLIGHTS[icao24].remove()
                            DRAWED_FLIGHTS[icao24] = add_polyline_on_map(FLIGHTS[icao24]["positions"], flgt_pth)
                        } else {
                            FLIGHTS[icao24] = {
                                icao24    : icao24,
                                call_sign : call_sign,
                                on_ground : on_ground,
                                category  : category,
                                positions : [[latitude,longitude,altitude]]
                            }
                        }
                        if(!on_ground) {
                            add_marker_on_map([latitude,longitude], flgt_pos)
                        }
                    })
                }
            })
            .catch( e => toggle_alerte(true))
            download(JSON.stringify(FLIGHTS), FILE_NAME_FLIGHTS, "text/plain");
    }
}

async function draw_flights() {
    for (const icao24 in FLIGHTS) {
        let points = FLIGHTS[icao24]["positions"].map(triplet => [triplet[0], triplet[1]])
        DRAWED_FLIGHTS[icao24] = add_polyline_on_map(points, flgt_pth)
    }
}