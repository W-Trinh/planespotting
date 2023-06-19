async function collect_green_spaces() {
    let reponses_obtenu = 0
    let max_alt = -1000.0
    let min_alt =  1000.0
    let green_spaces = []

    fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=espaces-verts&rows=3931&q=ENA')
            .then(res => res.json())
            .then(data => {
                data.records.forEach( async (record) => {
                        let polygon_data = await get_average_altitude_of_polygon(record)
                        let data = format_green_spaces(record, polygon_data)
                        green_spaces.push(data)
                        if (!isNaN(avg_altitude)) {
                            let res = update_max_min_alt(data.avg_altitude, min_alt, max_alt)
                            min_alt = res[0]
                            max_alt = res[1] 
                        }
                    }
                );
                reponses_obtenu++
            });

    fetch('https://data.toulouse-metropole.fr/api/records/1.0/search/?dataset=espaces-verts&rows=3931&q=PJS')
        .then(res => res.json())
        .then(data => {
            data.records.forEach( async record => {
                    let polygon_data = await get_average_altitude_of_polygon(record)
                    let data = format_green_spaces(record, polygon_data)
                    green_spaces.push(data)
                    if (!isNaN(avg_altitude)) {
                        let res = update_max_min_alt(avg_altitude, min_alt, max_alt)
                        min_alt = res[0]
                        max_alt = res[1] 
                    }
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

    return [[min_alt,max_alt],green_spaces]
}


function draw_green_spaces() {
    //draw on green spaces altitudes layer
    for (const green_space of GREEN_SPACES) {
        const shape = green_space.green_space.fields.geo_shape;
        const fields = green_space.green_space.fields;
        const popupContent = `<strong>${fields.nom}</strong><br>Type: ${fields.type} <br>Altitude moyenne: ${green_space.avg_altitude} m  <br>Surface: ${fields.surface_m2} m²`;
        const color = GREEN_SPACES_GRADIENT[percent_on_range(green_space.avg_altitude, ALTITUDES_RANGE[0], ALTITUDES_RANGE[1])]
        L.geoJson(shape, 
            {
                style: {
                    fillColor: color, 
                    fillOpacity: 0.5,    
                    color: color,     
                    weight: 1            
                }
            }
        ).bindPopup(popupContent).addTo(grsp_ava);
    } 
}
