async function collect_espaces_verts() {
    let reponses_obtenu = 0
    let max_alt = -1000.0
    let min_alt =  1000.0
    let green_spaces = []

    fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=espaces-verts&rows=3931&q=ENA')
            .then(res => res.json())
            .then(data => {
                data.records.forEach( async (record) => {
                        const shape = record.fields.geo_shape;
                        const fields = record.fields;
                        let alt = await get_average_altitude_of_polygon(record)
                        green_spaces.push({
                            green_space: record,
                            avg_altitude: alt
                        })
                        //add_label_on_map(record.fields.geo_point_2d, alt+"m")
                        if (!isNaN(alt)) {
                            let res = update_max_min_alt(alt, min_alt, max_alt)
                            min_alt = res[0]
                            max_alt = res[1] 
                        }
                        //console.log(min_alt, " ", max_alt, " | alt : ", alt)
                        // const popupContent = `<strong>${fields.nom}</strong><br>Type: ${fields.type}<br>Surface: ${fields.surface_m2} m²`;
                        // L.geoJson(shape, 
                        //     {
                        //         style: {
                        //             fillColor: GRADIENT[percent_on_range(alt, MIN_ALTITUDE, MAX_ALTITUDE)], 
                        //             fillOpacity: 0.5,    
                        //             color: GRADIENT[percent_on_range(alt, MIN_ALTITUDE, MAX_ALTITUDE)],     
                        //             weight: 1            
                        //         }
                        //     }
                        // ).bindPopup(popupContent).addTo(map);
                    }
                );
                reponses_obtenu++
            });

    fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=espaces-verts&rows=3931&q=PJS')
        .then(res => res.json())
        .then(data => {
            data.records.forEach( async record => {
                    const shape = record.fields.geo_shape;
                    const fields = record.fields;
                    let alt = await get_average_altitude_of_polygon(record)
                    green_spaces.push({
                        green_space: record,
                        avg_altitude: alt
                    })
                    //add_label_on_map(record.fields.geo_point_2d, alt+"m")
                    if (!isNaN(alt)) {
                        let res = update_max_min_alt(alt, min_alt, max_alt)
                        min_alt = res[0]
                        max_alt = res[1] 
                    }
                    //console.log(min_alt, " ", max_alt, " | alt : ", alt)
                    // const popupContent = `<strong>${fields.nom}</strong><br>Type: ${fields.type}<br>Surface: ${fields.surface_m2} m²`;
                    // L.geoJson(shape, 
                    //     {
                    //         style: {
                    //             fillColor: GRADIENT[percent_on_range(alt, MIN_ALTITUDE, MAX_ALTITUDE)],  
                    //             fillOpacity: 0.5,    
                    //             color: GRADIENT[percent_on_range(alt, MIN_ALTITUDE, MAX_ALTITUDE)],      
                    //             weight: 1           
                    //         }
                    //     }
                    // ).bindPopup(popupContent).addTo(map);
                }
            );
            reponses_obtenu++
        });

    //on attend toutes les réponses
    let waited_for = 0
    while( reponses_obtenu < 2 && waited_for <= MAX_LOOP_ALLOWED ) {
        waited_for++
        await sleep(4000)
    }
    //console.log("min : ", min_alt, " | max : ", max_alt)

    return [[min_alt,max_alt],green_spaces]
}

function store_green_spaces(){}
function load_green_spaces(){}
function collect_green_spaces(){ collect_espaces_verts() }
